# Payout — Merchant Payout & Collection Backend

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://hub.docker.com/r/tejas69/mini-payout-app/tags)
[![Deployed on Railway](https://img.shields.io/badge/Deployed-Railway-0B0D0E?logo=railway&logoColor=white)](https://mini-payout-v2-production.up.railway.app)
[![GraphQL](https://img.shields.io/badge/GraphQL-E10098?logo=graphql&logoColor=white)](https://graphql.org/)

A production-style payment processing backend built from scratch — merchant wallets, bank channel onboarding, topups, payouts, and beneficiary management — implementing the concurrency, security, and reliability patterns used in real fintech systems.

**Live API:** [mini-payout-v2-production.up.railway.app](https://mini-payout-v2-production.up.railway.app)
**Docker Image:** [hub.docker.com/r/tejas69/mini-payout-app](https://hub.docker.com/r/tejas69/mini-payout-app/tags)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Core Engineering Decisions](#core-engineering-decisions)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Local Setup](#local-setup)
  - [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## Overview

Payout models a merchant-facing payments platform end to end:

- Merchants register, add and verify bank **channels**, and hold a **wallet**.
- Merchants **top up** their wallet from a verified channel; an admin (or an automated, signature-verified bank webhook) approves the transfer.
- Merchants add **beneficiaries** (external bank accounts or other merchants' internal wallets), which an admin verifies.
- Merchants **pay out** from their wallet to a verified beneficiary, with the same atomicity and concurrency guarantees a real ledger requires.

Every state-changing action is audit-logged, every financial write is atomic and concurrency-safe, and the full stack — API, background worker, database, and cache — is containerized and deployed as independent services.

---

## Architecture

```
                              ┌──────────────────────┐
                              │        Client         │
                              │  (Swagger / Postman /  │
                              │     Web / Mobile)      │
                              └──────────┬─────────────┘
                                         │  HTTPS (REST + GraphQL + WebSocket)
                     ┌───────────────────┼────────────────────┐
                     │                   │                    │
             ┌───────▼───────┐   ┌───────▼────────┐   ┌───────▼────────┐
             │   Express API   │   │   Socket.IO     │   │  GraphQL (/graphql) │
             │  (routes →      │   │  (JWT-auth'd,    │   │  schema + resolvers │
             │  controllers →  │   │  real-time push) │   │  reuse REST services │
             │  services)      │   └───────┬────────┘   └───────┬────────┘
             └───────┬────────┘            │                     │
                     │                     └──────────┬──────────┘
                     │                                │
        ┌────────────┼───────────────┬────────────────┤
        │             │                │                │
┌───────▼──────┐ ┌────▼─────┐  ┌───────▼───────┐ ┌──────▼───────┐
│  PostgreSQL   │ │  Redis    │  │   BullMQ       │ │  Bank Webhook │
│  (Prisma ORM) │ │  (cache + │  │   Worker       │ │  (HMAC-signed │
│  wallets,      │ │  job queue)│  │  (background   │ │  auto-approval)│
│  transactions, │ └───────────┘  │  notifications) │ └───────────────┘
│  audit log     │                └────────────────┘
└────────────────┘
```

**Request flow:** `Route → Middleware (auth, validation, rate limit) → Controller → Service → Prisma → PostgreSQL`

**Side-effect flow (always *after* the core write commits):** cache invalidation → background job enqueue → WebSocket push → audit log entry. A failure in any of these never rolls back or blocks a completed financial transaction.

---

## Core Engineering Decisions

These are the decisions worth understanding, not just the features:

| Decision | Why |
|---|---|
| **Optimistic concurrency control** on `Wallet.version`, not row-level locks | Payout writes to a single wallet are low-contention; a conditional `UPDATE ... WHERE version = X` costs nothing when there's no conflict and fails fast (409, client retries) when there is — cheaper than blocking writers under the common case |
| **Idempotency keys** on `Transaction`, checked before any write | Protects against duplicate payouts from client retries or network blips — a repeated request with the same key returns the original result instead of double-debiting |
| **HMAC-SHA256 signed webhooks** for bank confirmation | The webhook endpoint has no user session — authenticity is proven by recomputing the signature server-side with a shared secret, not by trusting the caller |
| **Cache-aside with write-path invalidation** (Redis) | Wallet reads are cached with a short TTL as a safety net, but every write that changes a balance actively deletes the cache key — never serves stale financial data |
| **Cursor-based (keyset) pagination**, not offset | `OFFSET` degrades on large tables and can skip/duplicate rows under concurrent writes; cursoring on `id` avoids both |
| **Async job pipeline decoupled from the request/response cycle** (BullMQ + Redis) | Non-critical side effects (notification delivery) never block or risk the transactional write that already succeeded; failures retry with exponential backoff independently |
| **Append-only audit log**, separate from business tables | Every state-changing action — including which actor performed it (admin vs. automated webhook) — is recorded permanently for traceability, independent of the current state of the row it describes |
| **Compound unique constraints** at the database layer | Duplicate beneficiaries (same account, or same linked internal wallet) are rejected by Postgres itself, not just application-level checks — the database is the source of truth for data integrity |
| **`onDelete: Restrict`** on `Transaction → Beneficiary` | A beneficiary that has ever received a payout cannot be deleted — the historical financial record is protected at the schema level |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime / Framework | Node.js, Express |
| Database / ORM | PostgreSQL, Prisma |
| Caching / Queue | Redis, BullMQ |
| Real-time | Socket.IO (JWT-authenticated WebSockets) |
| API Layer | REST, GraphQL (`graphql`, `express-graphql`) |
| Validation | Zod |
| Auth | JWT, bcrypt |
| Docs | Swagger / OpenAPI (`swagger-jsdoc`, `swagger-ui-express`) |
| Testing | Vitest, Supertest |
| Containerization | Docker, Docker Compose |
| Deployment | Railway (multi-service: API, worker, managed Postgres, managed Redis) |
| Registry | Docker Hub |

---

## Features

**Core Payments**
- Merchant registration with auto-created wallet
- Bank channel onboarding with admin verification and selection
- Wallet top-up requests with admin or automated approval
- Beneficiary management (bank accounts + internal wallet transfers) with verification and blocking
- Payouts with atomic wallet debits, optimistic locking, and idempotency

**Reliability & Security**
- HMAC-signed webhook endpoint simulating automated bank transfer confirmation
- Centralized error handling with typed error classes
- Rate limiting (general + stricter auth-route limits)
- Zod schema validation on every mutating endpoint
- Compound unique constraints and foreign-key integrity at the database layer

**Async & Real-Time**
- Redis-backed BullMQ queue for payout notifications, with automatic retry and exponential backoff
- JWT-authenticated WebSocket channel pushing live updates on topup approval and payout completion

**Performance & Observability**
- Cache-aside Redis caching on wallet reads, invalidated on every write
- Cursor-based (keyset) pagination on large result sets
- Compound and single-column indexes, validated with `EXPLAIN ANALYZE`
- Append-only audit log covering 11 distinct actions across every module

**Delivery**
- Full Swagger/OpenAPI documentation
- Integration tests against an isolated test database
- Multi-service Docker Compose setup (API, worker, Postgres, Redis)
- Published application image on Docker Hub
- Live multi-service deployment on Railway

---

## Project Structure

```
mini-payout-v2/
├── prisma/
│   ├── schema.prisma          # User, Wallet, Channel, TopUpRequest, Transaction, Beneficiary, AuditLog
│   ├── migrations/
│   └── seed.js
├── src/
│   ├── config/                 # db, redis, swagger singletons
│   ├── controllers/             # HTTP layer — request in, response out
│   ├── services/                 # business logic, all Prisma queries
│   ├── routes/                    # Express routers per resource
│   ├── middlewares/                # auth, validation, rate limiting, error handling, webhook signature
│   ├── validators/                  # Zod schemas
│   ├── queues/                       # BullMQ queue definitions
│   ├── workers/                       # BullMQ worker processes
│   ├── graphql/                        # schema + resolvers (reuse REST services)
│   ├── utils/                           # errors, cache helpers, audit log, notify (WebSocket)
│   └── lib/                              # hashing, JWT helpers
├── tests/                                 # Vitest + Supertest integration tests
├── scripts/                                # bank webhook simulation script
├── test-client/                             # standalone WebSocket test page
├── Dockerfile
├── docker-compose.yml                        # app + worker + postgres + redis
└── app.js / server.js
```

---

## Getting Started

### Local Setup

**Prerequisites:** Node.js 20+, PostgreSQL, Redis

```bash
git clone https://github.com/TejasAnil4/mini-payout-v2.git
cd mini-payout-v2
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, WEBHOOK_SECRET, REDIS_HOST, REDIS_PORT
npx prisma migrate dev
npx prisma db seed      # optional — creates admin/merchant test accounts
npm run dev              # starts the API on :5005
npm run worker            # in a separate terminal — starts the BullMQ worker
```

### Docker Setup

The fastest way to run the entire stack — API, worker, PostgreSQL, and Redis — with one command:

```bash
git clone https://github.com/TejasAnil4/mini-payout-v2.git
cd mini-payout-v2
cp .env.example .env   # fill in DB_PASSWORD, JWT_SECRET, WEBHOOK_SECRET
docker-compose up
```

This builds the application image, provisions Postgres and Redis containers, runs migrations automatically, and starts both the API and the background worker — connected on a shared internal network.

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing/verifying JWTs |
| `WEBHOOK_SECRET` | Shared secret for HMAC webhook signature verification |
| `REDIS_HOST` / `REDIS_PORT` | Redis connection details |
| `REDIS_PASSWORD` | Redis auth password (required in managed environments, e.g. Railway) |
| `PORT` | API server port (defaults to `5005`) |

See `.env.example` for the full template.

---

## API Documentation

Interactive Swagger docs are available at `/api-docs` on any running instance:

```
http://localhost:5005/api-docs
```

A GraphQL endpoint is also available at `/graphql`, exposing read queries (e.g. `myWallet`, `myTransactions`) that reuse the same service layer as the REST API.

---

## Testing

```bash
npm test
```

Runs the Vitest + Supertest suite against an isolated `_test` database (configured via `.env.test`), completely separate from development data.

---

## Deployment

Deployed on **Railway** as four independent services sharing a private network:

- **API** — runs migrations on deploy, then starts the Express server
- **Worker** — runs the BullMQ payout-notification processor
- **PostgreSQL** — managed instance
- **Redis** — managed instance, authenticated

The application image is also published to **Docker Hub**, so the full stack can be reproduced anywhere Docker is available via `docker-compose up`, without checking out the source.

---

## Roadmap

- [ ] Expand GraphQL coverage beyond wallet/transaction queries
- [ ] TypeScript migration
- [ ] Additional integration test coverage (payout idempotency, concurrency conflict paths)
- [ ] CI pipeline running tests on every push

---

## Author

**Tejas Anil** — [GitHub](https://github.com/TejasAnil4) · [LinkedIn](https://linkedin.com/in/tejas-anil-q18)