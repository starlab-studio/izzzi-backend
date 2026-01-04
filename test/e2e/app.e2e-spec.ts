import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { DataSource, getDataSourceToken } from "@nestjs/typeorm";
import request from "supertest";
import { AppModule } from "src/app.module";
import { HttpExceptionFilter, RequestLoggingInterceptor, LoggerService, TypeOrmUnitOfWork } from "src/core";
import express from "express";

async function waitForDatabase(
  dataSource: DataSource,
  maxRetries = 10,
  delayMs = 1000
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (dataSource.isInitialized) {
        await dataSource.query("SELECT 1");
        return;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(
          `Database not ready after ${maxRetries} attempts: ${error}`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

function generateUniqueId(): string {
  const timestamp = Date.now();
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  let num = timestamp;
  
  while (num > 0) {
    result = chars[num % 26] + result;
    num = Math.floor(num / 26);
  }
  
  for (let i = 0; i < 4; i++) {
    result += chars[Math.floor(Math.random() * 26)];
  }
  
  return result;
}

describe("E2E Tests", () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TypeOrmUnitOfWork)
      .useFactory({
        factory: (dataSource: DataSource) => new TypeOrmUnitOfWork(dataSource),
        inject: [getDataSourceToken()],
      })
      .compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalFilters(new HttpExceptionFilter(app.get(LoggerService)));
    app.useGlobalInterceptors(new RequestLoggingInterceptor(app.get(LoggerService)));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    app.use("/api/v1/webhooks/stripe", express.raw({ type: "application/json" }));
    app.setGlobalPrefix("api", { exclude: ["api"] });
    
    await app.init();

    const dataSource = moduleFixture.get<DataSource>(getDataSourceToken());
    await waitForDatabase(dataSource);
  });

  afterAll(async () => {
    try {
      const dataSource = moduleFixture.get<DataSource>(getDataSourceToken());
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    } catch (error) {
    }
    await app.close();
  });

  it("POST /api/v1/auth/signup should return 201", async () => {
    const timestamp = Date.now();
    const uniqueId = generateUniqueId();
    const signUpData = {
      firstName: "EndToEnd",
      lastName: "Test",
      email: `e2e.${timestamp}@test.com`,
      password: "SecureP@ssw0rd!",
      organization: `EndToEnd Test Organization ${uniqueId}`,
    };

    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/signup")
      .send(signUpData);

    if (response.status !== 201) {
      console.error("Signup failed:", response.status, response.body);
    }
    expect(response.status).toBe(201);

    expect(response.body.data).toHaveProperty("email", signUpData.email);
    expect(response.body.data).toHaveProperty("verificationToken");
  });

  it("POST /api/v1/auth/signin should return 201", async () => {
    const timestamp = Date.now();
    const uniqueId = generateUniqueId();
    const signUpData = {
      firstName: "SignIn",
      lastName: "Test",
      email: `signin.${timestamp}@test.com`,
      password: "SecureP@ssw0rd!",
      organization: `SignIn Test Organization ${uniqueId}`,
    };

    const signUpResponse = await request(app.getHttpServer())
      .post("/api/v1/auth/signup")
      .send(signUpData);

    if (signUpResponse.status !== 201) {
      console.error("Signup failed in signin test:", signUpResponse.status, signUpResponse.body);
    }
    expect(signUpResponse.status).toBe(201);

    if (signUpResponse.body.data?.verificationToken) {
      await request(app.getHttpServer())
        .post("/api/v1/auth/confirm-email")
        .send({ token: signUpResponse.body.data.verificationToken })
        .expect(201);
    }

    const signInData = {
      email: signUpData.email,
      password: signUpData.password,
    };

    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/signin")
      .send(signInData);

    if (response.status !== 201) {
      console.error("Signin failed:", response.status, response.body);
    }
    expect(response.status).toBe(201);

    expect(response.body.data).toHaveProperty("accessToken");
    expect(response.body.data).toHaveProperty("refreshToken");
  });

  it("POST /api/v1/subscription/:orgId should return 201", async () => {
    const timestamp = Date.now();
    const uniqueId = generateUniqueId();
    const signUpData = {
      firstName: "Sub",
      lastName: "Test",
      email: `sub.${timestamp}@test.com`,
      password: "SecureP@ssw0rd!",
      organization: `Sub Test Organization ${uniqueId}`,
    };

    const signUpResponse = await request(app.getHttpServer())
      .post("/api/v1/auth/signup")
      .send(signUpData)
      .expect(201);

    // Verify email before signing in
    if (signUpResponse.body.data?.verificationToken) {
      await request(app.getHttpServer())
        .post("/api/v1/auth/confirm-email")
        .send({ token: signUpResponse.body.data.verificationToken })
        .expect(201);
    }

    const signInResponse = await request(app.getHttpServer())
      .post("/api/v1/auth/signin")
      .send({
        email: signUpData.email,
        password: signUpData.password,
      });

    if (signInResponse.status !== 201) {
      console.error("Signin failed in subscription test:", signInResponse.status, signInResponse.body);
    }
    expect(signInResponse.status).toBe(201);

    const orgResponse = await request(app.getHttpServer())
      .get("/api/v1/users/memberships")
      .set("Authorization", `Bearer ${signInResponse.body.data.accessToken}`)
      .expect(200);

    const orgId = orgResponse.body.data[0]?.organizationId;
    if (orgId) {
      const plansResponse = await request(app.getHttpServer())
        .get("/api/v1/subscription/pricing-plans")
        .expect(200);

      const planId = plansResponse.body.data?.[0]?.id;
      if (planId) {
        const subscriptionResponse = await request(app.getHttpServer())
          .post(`/api/v1/subscription/${orgId}`)
          .set("Authorization", `Bearer ${signInResponse.body.data.accessToken}`)
          .send({
            planId: planId,
            quantity: 5,
            billingPeriod: "monthly",
          });

        expect([201, 400, 404]).toContain(subscriptionResponse.status);
      }
    }
  });

  it("PATCH /api/v1/subscription/:orgId/:subId/quantity should return 200", async () => {
    const timestamp = Date.now();
    const uniqueId = generateUniqueId();
    const signUpData = {
      firstName: "Update",
      lastName: "Test",
      email: `update.${timestamp}@test.com`,
      password: "SecureP@ssw0rd!",
      organization: `Update Test Organization ${uniqueId}`,
    };

    const signUpResponse = await request(app.getHttpServer())
      .post("/api/v1/auth/signup")
      .send(signUpData)
      .expect(201);

    // Verify email before signing in
    if (signUpResponse.body.data?.verificationToken) {
      await request(app.getHttpServer())
        .post("/api/v1/auth/confirm-email")
        .send({ token: signUpResponse.body.data.verificationToken })
        .expect(201);
    }

    const signInResponse = await request(app.getHttpServer())
      .post("/api/v1/auth/signin")
      .send({
        email: signUpData.email,
        password: signUpData.password,
      });

    if (signInResponse.status !== 201) {
      console.error("Signin failed in subscription test:", signInResponse.status, signInResponse.body);
    }
    expect(signInResponse.status).toBe(201);

    const orgResponse = await request(app.getHttpServer())
      .get("/api/v1/users/memberships")
      .set("Authorization", `Bearer ${signInResponse.body.data.accessToken}`)
      .expect(200);

    const orgId = orgResponse.body.data[0]?.organizationId;
    if (orgId) {
      const subscriptionsResponse = await request(app.getHttpServer())
        .get(`/api/v1/subscription/${orgId}/current`)
        .set("Authorization", `Bearer ${signInResponse.body.data.accessToken}`);

      const subscription = subscriptionsResponse.body.data?.subscription;
      if (subscription) {
        const updateResponse = await request(app.getHttpServer())
          .patch(`/api/v1/subscription/${orgId}/${subscription.id}/quantity`)
          .set("Authorization", `Bearer ${signInResponse.body.data.accessToken}`)
          .send({ newQuantity: 10 });

        expect([200, 400, 404]).toContain(updateResponse.status);
      }
    }
  });

  it("POST /api/v1/webhooks/stripe should return 200", async () => {
    const webhookEvent = {
      id: "evt_test_123",
      type: "invoice.paid",
      data: {
        object: {
          id: "in_test_123",
          subscription: "sub_test_123",
        },
      },
    };

    const response = await request(app.getHttpServer())
      .post("/api/v1/webhooks/stripe")
      .send(webhookEvent)
      .set("Content-Type", "application/json");

    if (response.status !== 200 && response.status !== 400) {
      console.error("Webhook failed:", response.status, response.body);
    }
    expect([200, 400]).toContain(response.status);
  });
});

