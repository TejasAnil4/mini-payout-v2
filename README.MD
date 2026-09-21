# Payout — Merchant Payout & Collection Backend

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://hub.docker.com/r/tejas69/mini-payout-app/tags)
[![Deployed on Railway](https://img.shields.io/badge/Deployed-Railway-0B0D0E?logo=railway&logoColor=white)](https://mini-payout-v2-production.up.railway.app)
[![GraphQL](https://img.shields.io/badge/GraphQL-E10098?logo=graphql&logoColor=white)](https://graphql.org/)

A production-grade merchant payout and collection backend implementing real fintech engineering patterns — optimistic concurrency control, idempotency, HMAC-signed webhooks, Redis-backed async job pipelines, WebSocket notifications, and a fully containerized multi-service deployment.

**Live API:** [mini-payout-v2-production.up.railway.app](https://mini-payout-v2-production.up.railway.app)  
**Swagger Docs:** [mini-payout-v2-production.up.railway.app/api-docs](https://mini-payout-v2-production.up.railway.app/api-docs)  
**Docker Hub:** [hub.docker.com/r/tejas69/mini-payout-app](https://hub.docker.com/r/tejas69/mini-payout-app/tags)

---

## Table of Contents

- [Architecture](#architecture)
- [Request Flow](#request-flow)
- [Core Engineering Decisions](#core-engineering-decisions)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Quick Run — No Code Needed](#quick-run--no-code-needed)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                   │
│              (Swagger UI / Postman / Web / Mobile)               │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────────┐
│                      EXPRESS API (port 5005)                      │
│  Routes → Middleware (JWT auth, Zod validation, rate limiting)    │
│         → Controllers → Services → Prisma → PostgreSQL            │
└──────┬──────────────────┬──────────────────────┬────────────────┘
       │                  │                       │
┌──────▼──────┐  ┌────────▼────────┐  ┌──────────▼──────────────┐
│  PostgreSQL  │  │     Redis        │  │   Socket.IO (WS)         │
│  (Prisma)   │  │  Cache + Queue   │  │  JWT-authenticated       │
│  Wallets     │  │  BullMQ jobs     │  │  Real-time push          │
│  Transactions│  │  30s TTL cache   │  │  on tx completion        │
└─────────────┘  └────────┬────────┘  └─────────────────────────┘
                          │
              ┌───────────▼──────────┐
              │   BullMQ Worker       │
              │   (separate process)  │
              │   Payout notifications│
              │   Retry + backoff     │
              └──────────────────────┘
```

---

## Request Flow

The complete lifecycle of a payout request — from merchant API call to real-time notification:

```
1. MERCHANT REQUEST
   POST /api/v1/payout
   Authorization: Bearer <JWT>
   Body: { beneficiaryId, amount, idempotencyKey }
         │
         ▼
2. MIDDLEWARE CHAIN
   ├── JWT verification (protect middleware)
   ├── Role check (MERCHANT only)
   ├── Zod schema validation
   └── Rate limiter (10 req/min per IP)
         │
         ▼
3. IDEMPOTENCY CHECK
   Does a transaction with this idempotencyKey already exist?
   ├── YES → return cached result (no duplicate charge)
   └── NO  → continue
         │
         ▼
4. OPTIMISTIC CONCURRENCY CONTROL
   UPDATE Wallet
   SET balance = balance - amount, version = version + 1
   WHERE id = ? AND version = currentVersion
   ├── 0 rows updated → ConflictError 409 (concurrent write detected)
   └── 1 row updated → continue
         │
         ▼
5. ATOMIC DB TRANSACTION (Prisma $transaction)
   ├── Wallet debit committed
   ├── Transaction record created (status: SUCCESS)
   └── Recipient wallet credited (if INTERNAL_WALLET type)
         │
         ▼
6. POST-TRANSACTION SIDE EFFECTS (after commit)
   ├── Redis cache invalidated (wallet:userId key deleted)
   ├── BullMQ job enqueued (payout notification)
   └── Audit log written
         │
         ▼
7. BACKGROUND WORKER (separate process)
   ├── Picks up BullMQ job from Redis queue
   ├── Processes notification
   ├── On failure: exponential backoff retry (up to 3 attempts)
   └── WebSocket push → merchant's connected browser
         │
         ▼
8. REAL-TIME NOTIFICATION
   Socket.IO emits to merchant's authenticated WebSocket connection
   { event: "payout_completed", transactionId, amount }
```

---

## Core Engineering Decisions

| Decision | Why |
|---|---|
| **Optimistic concurrency control** on `Wallet.version` | Low write contention on individual wallets — fail-fast conditional update cheaper than blocking row lock. Retryable 409 vs deadlock risk |
| **Idempotency keys** on `Transaction` | Protects against duplicate payouts from client retries or network blips — same key always returns original result |
| **HMAC-SHA256 webhook verification** | No user session on the webhook endpoint — authenticity proven by recomputing signature server-side with shared secret |
| **Cache-aside with write-path invalidation** | Wallet reads cached 30s in Redis; every write actively deletes the cache key — never serves stale financial data |
| **Cursor-based keyset pagination** | `OFFSET` degrades on large tables and skips rows under concurrent writes; cursoring on `id` avoids both |
| **BullMQ decoupled from request path** | Non-critical side effects (notifications) never block or risk the transaction that already succeeded |
| **Append-only audit log** | Every state-changing action recorded permanently — separate from business tables, survives row updates |
| **Compound unique constraints** on `Beneficiary` | Duplicate bank account / internal wallet prevention enforced at DB layer, not just application code |
| **`onDelete: Restrict`** on `Transaction → Beneficiary` | Historical payout records protected — a beneficiary that received money cannot be deleted |
| **Separate worker process** | BullMQ worker runs independently — main API process never blocks on notification delivery |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime / Framework | Node.js 20, Express |
| Database / ORM | PostgreSQL 16, Prisma 6 |
| Caching / Queue | Redis 7, BullMQ |
| Real-time | Socket.IO (JWT-authenticated WebSockets) |
| API | REST + GraphQL (`graphql`, `express-graphql`) |
| Validation | Zod |
| Auth | JWT, bcrypt |
| Docs | Swagger / OpenAPI |
| Testing | Vitest, Supertest |
| Containerization | Docker, Docker Compose |
| Deployment | Railway (API + worker + managed Postgres + Redis) |
| Registry | Docker Hub |

---

## Features

**Core Payment Flows**
- Merchant registration with auto-created wallet (atomic)
- Bank channel onboarding with admin verification and selection
- Wallet top-up with admin or automated bank webhook approval
- Beneficiary management (bank accounts + internal wallet transfers)
- Payouts with atomic wallet debits, optimistic locking, idempotency

**Reliability & Security**
- HMAC-SHA256 signed webhook endpoint simulating bank transfer confirmation
- Centralized error handling with typed error classes (400/401/403/404/409)
- Rate limiting (stricter on auth routes)
- Zod schema validation on all mutating endpoints
- Compound unique constraints and FK integrity at database layer

**Async & Real-Time**
- Redis-backed BullMQ queue for payout notifications
- Automatic retry with exponential backoff (3 attempts)
- JWT-authenticated WebSocket channel for real-time transaction updates

**Performance & Observability**
- Cache-aside Redis caching on wallet reads, invalidated on writes
- Cursor-based keyset pagination on all admin list endpoints
- Compound indexing validated with EXPLAIN ANALYZE
- Append-only audit log (11 action types, every module)

**GraphQL**
- `/graphql` endpoint alongside REST
- `myWallet` query — returns authenticated merchant's wallet
- `myTransactions(type)` query — filterable by PAYOUT or WALLET_TOPUP
- Reuses existing REST service layer — no duplicate business logic

---

## Quick Run — No Code Needed

Run the entire stack (API + worker + PostgreSQL + Redis) with just Docker Desktop and two files.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running

### Step 1 — Create a folder

```bash
mkdir mini-payout && cd mini-payout
```

### Step 2 — Create a `docker-compose.yml` file

Create a file named `docker-compose.yml` in that folder with this content:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: mini-payout-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: "${DB_PASSWORD}"
      POSTGRES_DB: mini_payout_v2
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    container_name: mini-payout-redis
    ports:
      - "6380:6379"

  app:
    image: tejas69/mini-payout-app:latest
    container_name: mini-payout-app
    ports:
      - "5006:5005"
    environment:
      DATABASE_URL: "postgresql://postgres:${DB_PASSWORD}@postgres:5432/mini_payout_v2"
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: "${JWT_SECRET}"
      WEBHOOK_SECRET: "${WEBHOOK_SECRET}"
      PORT: 5005
    depends_on:
      - postgres
      - redis
    command: sh -c "npx prisma migrate deploy && npx prisma db seed && node server.js"

  worker:
    image: tejas69/mini-payout-app:latest
    container_name: mini-payout-worker
    environment:
      DATABASE_URL: "postgresql://postgres:${DB_PASSWORD}@postgres:5432/mini_payout_v2"
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ""
    depends_on:
      - postgres
      - redis
    command: node src/workers/payoutNotification.worker.js

volumes:
  postgres_data:
```

### Step 3 — Create a `.env` file

Create a file named `.env` in the same folder with your own values:

```
DB_PASSWORD=choose_any_password
JWT_SECRET=any_random_string_minimum_32_characters_long_abc123
WEBHOOK_SECRET=any_random_string_minimum_32_characters_long_xyz456
```

> ⚠️ These are placeholder values — set anything you like. They just need to be consistent across the `.env` file and the running containers. Never use weak values like these in production.

### Step 4 — Run

```bash
docker-compose up
```

Docker will automatically pull all images (your app from Docker Hub, official Postgres and Redis images). Wait about 60 seconds until you see:

```
mini-payout-app | Database connected
mini-payout-app | Server running on http://localhost:5005
mini-payout-worker | Payout notification worker started, waiting for jobs...
```

### Step 5 — Test

Open the Swagger docs: **http://localhost:5006/api-docs**

**Pre-seeded test accounts (ready to use immediately):**

| Role | Email | Password |
|---|---|---|
| Admin | admin@test.com | admin1234 |
| Merchant | merchant1@test.com | merchant1234 |
| Merchant (funded) | neymar@test.com | neymar123 |

> Neymar has a verified channel, funded wallet, and verified beneficiary — ready for payout testing immediately.

### Stop

```bash
# Stop containers (data persists)
docker-compose down

# Stop and wipe all data
docker-compose down -v
```

---

## Local Development Setup

For developers who want to run with live code changes.

**Prerequisites:** Node.js 20+, PostgreSQL 16, Redis 7

```bash
git clone https://github.com/TejasAnil4/mini-payout-v2.git
cd mini-payout-v2
npm install
cp .env.example .env        # fill in your local values
npx prisma migrate dev
npx prisma db seed
npm run dev                  # API on :5005
npm run worker               # in a separate terminal
```

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `DB_PASSWORD` | Postgres container password (Docker only) | Docker only |
| `JWT_SECRET` | Secret for signing JWTs (min 32 chars) | ✅ |
| `WEBHOOK_SECRET` | Shared secret for HMAC webhook verification | ✅ |
| `REDIS_HOST` | Redis hostname | ✅ |
| `REDIS_PORT` | Redis port | ✅ |
| `PORT` | API server port (default: 5005) | Optional |

See `.env.example` for the full template.

---

## API Documentation

### REST — Swagger UI

Interactive docs available at `/api-docs`:

- **Live:** https://mini-payout-v2-production.up.railway.app/api-docs
- **Local:** http://localhost:5006/api-docs

Endpoints are grouped by resource (Auth, Wallet, Channel, TopUp, Beneficiary, Payout, Webhooks). Every endpoint shows request schema, response schema, and can be tested live.

### GraphQL

Available at `/graphql` alongside REST. Reuses the same service layer.

```graphql
# Get wallet balance
{ myWallet { balance status } }

# Get all payouts
{ myTransactions(type: "PAYOUT") { referenceId amount status createdAt } }

# Get both in one request
{
  myWallet { balance }
  myTransactions(type: "PAYOUT") { referenceId amount }
}
```

**Endpoint:** `POST /graphql`
**Auth:** `Authorization: Bearer <token>` header

---

## Testing

```bash
npm test
```

Runs Vitest + Supertest integration tests against an isolated test database (`mini_payout_v2_test`). Configured via `.env.test` — completely separate from development data.

---

## Deployment

Deployed on **Railway** as four independent services sharing a private internal network:

| Service | Role | Start Command |
|---|---|---|
| `mini-payout-v2` | Express API | `npx prisma migrate deploy && node server.js` |
| `mini-payout-worker` | BullMQ worker | `node src/workers/payoutNotification.worker.js` |
| `Postgres` | Managed database | — |
| `Redis` | Managed cache + queue | — |

The application image is published to **Docker Hub** (`tejas69/mini-payout-app:latest`), making the full stack reproducible anywhere Docker is available via `docker-compose up`.

**Live URL:** https://mini-payout-v2-production.up.railway.app

---

## Author

**Tejas Anil** — [GitHub](https://github.com/TejasAnil4) · [LinkedIn](https://linkedin.com/in/tejas-anil-q18)