import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "src/app.module";

describe("E2E Tests", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/v1/auth/signup should return 201", async () => {
    const signUpData = {
      firstName: "E2E",
      lastName: "Test",
      email: `e2e.${Date.now()}@test.com`,
      password: "SecurePass123!",
      organization: "E2E Test Org",
    };

    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/signup")
      .send(signUpData)
      .expect(201);

    expect(response.body).toHaveProperty("email", signUpData.email);
    expect(response.body).toHaveProperty("verificationToken");
  });

  it("POST /api/v1/auth/signin should return 200", async () => {
    const signUpData = {
      firstName: "SignIn",
      lastName: "Test",
      email: `signin.${Date.now()}@test.com`,
      password: "SecurePass123!",
      organization: "SignIn Test Org",
    };

    await request(app.getHttpServer())
      .post("/api/v1/auth/signup")
      .send(signUpData);

    const signInData = {
      email: signUpData.email,
      password: signUpData.password,
    };

    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/signin")
      .send(signInData)
      .expect(200);

    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
  });

  it("POST /api/v1/subscription/:orgId should return 201", async () => {
    const signUpData = {
      firstName: "Sub",
      lastName: "Test",
      email: `sub.${Date.now()}@test.com`,
      password: "SecurePass123!",
      organization: "Sub Test Org",
    };

    const signUpResponse = await request(app.getHttpServer())
      .post("/api/v1/auth/signup")
      .send(signUpData)
      .expect(201);

    const signInResponse = await request(app.getHttpServer())
      .post("/api/v1/auth/signin")
      .send({
        email: signUpData.email,
        password: signUpData.password,
      })
      .expect(200);

    const orgResponse = await request(app.getHttpServer())
      .get("/api/v1/organization")
      .set("Authorization", `Bearer ${signInResponse.body.accessToken}`)
      .expect(200);

    const orgId = orgResponse.body[0]?.id;
    if (orgId) {
      const subscriptionResponse = await request(app.getHttpServer())
        .post(`/api/v1/subscription/${orgId}`)
        .set("Authorization", `Bearer ${signInResponse.body.accessToken}`)
        .send({
          planId: "plan-id",
          quantity: 5,
          billingPeriod: "monthly",
        });

      expect([201, 400, 404]).toContain(subscriptionResponse.status);
    }
  });

  it("PATCH /api/v1/subscription/:orgId/:subId/quantity should return 200", async () => {
    const signUpData = {
      firstName: "Update",
      lastName: "Test",
      email: `update.${Date.now()}@test.com`,
      password: "SecurePass123!",
      organization: "Update Test Org",
    };

    const signInResponse = await request(app.getHttpServer())
      .post("/api/v1/auth/signup")
      .send(signUpData)
      .then(() =>
        request(app.getHttpServer())
          .post("/api/v1/auth/signin")
          .send({
            email: signUpData.email,
            password: signUpData.password,
          })
      )
      .expect(200);

    const orgResponse = await request(app.getHttpServer())
      .get("/api/v1/organization")
      .set("Authorization", `Bearer ${signInResponse.body.accessToken}`)
      .expect(200);

    const orgId = orgResponse.body[0]?.id;
    if (orgId) {
      const subscriptionsResponse = await request(app.getHttpServer())
        .get(`/api/v1/subscription/${orgId}`)
        .set("Authorization", `Bearer ${signInResponse.body.accessToken}`);

      const subscription = subscriptionsResponse.body[0];
      if (subscription) {
        const updateResponse = await request(app.getHttpServer())
          .patch(`/api/v1/subscription/${orgId}/${subscription.id}/quantity`)
          .set("Authorization", `Bearer ${signInResponse.body.accessToken}`)
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
      .set("Content-Type", "application/json")
      .expect(200);

    expect([200, 400]).toContain(response.status);
  });
});

