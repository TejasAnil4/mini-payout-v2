import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import prisma from "../src/config/db.js";

describe("Auth — Register", () => {
  afterAll(async () => {
    await prisma.wallet.deleteMany({
      where: { user: { email: { contains: "test-vitest" } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: "test-vitest" } },
    });
    await prisma.$disconnect();
  });

  it("should register a new user and auto-create a wallet", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "test-vitest-1@test.com",
        password: "password123",
        fullName: "Vitest User",
        phoneNumber: "9000000001",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe("test-vitest-1@test.com");
    expect(response.body.data.password).toBeUndefined();
  });

  it("should reject duplicate email with 409", async () => {
    await request(app).post("/api/v1/auth/register").send({
      email: "test-vitest-2@test.com",
      password: "password123",
      fullName: "Vitest User Two",
      phoneNumber: "9000000002",
    });

    const response = await request(app).post("/api/v1/auth/register").send({
      email: "test-vitest-2@test.com",
      password: "password123",
      fullName: "Vitest User Two",
      phoneNumber: "9000000003",
    });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it("should reject invalid email format with 400", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "not-an-email",
      password: "password123",
      fullName: "Vitest User",
      phoneNumber: "9000000004",
    });

    expect(response.status).toBe(400);
    expect(response.body.errors.email).toBeDefined();
  });
});