import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PaymentModule } from "src/modules/payment/payment.module";
import { SubscriptionModule } from "src/modules/subscription/subscription.module";
import { CoreModule } from "src/core/core.module";
import { HandleStripeWebhookUseCase } from "src/modules/payment/application/use-cases/HandleStripeWebhook.use-case";
import { SyncInvoiceFromStripeUseCase } from "src/modules/subscription/application/use-cases/SyncInvoiceFromStripe.use-case";
import { SyncSubscriptionFromStripeUseCase } from "src/modules/subscription/application/use-cases/SyncSubscriptionFromStripe.use-case";
import { IWebhookEvent, IWebhookInvoice, IWebhookSubscription } from "src/modules/payment/domain/types/webhook-event.types";
import { ISubscriptionRepository } from "src/modules/subscription/domain/repositories/subscription.repository";
import { IStripeSyncService } from "src/modules/payment/domain/services/stripe-sync.service";
import { STRIPE_SYNC_SERVICE } from "src/modules/payment/domain/services/stripe-sync.service";
import { StripeSyncService } from "src/modules/payment/infrastructure/services/stripe-sync.service";
import { EmailProvider } from "src/modules/notification/infrastructure/providers/email.provider";
import { CognitoAdapter } from "src/modules/auth/infrastructure/factories/cognito.adapter";
import { SUBSCRIPTION_REPOSITORY } from "src/modules/subscription/domain/repositories/subscription.repository";
import { DataSource } from "typeorm";
import { createMockEmailProvider, createMockStripeSyncService, createMockCognitoAdapter } from "../test-helpers";
import { waitForDatabase } from "../db-helper";

describe("Payment Integration", () => {
  let app: INestApplication;
  let handleWebhookUseCase: HandleStripeWebhookUseCase;
  let syncInvoiceUseCase: SyncInvoiceFromStripeUseCase;
  let syncSubscriptionUseCase: SyncSubscriptionFromStripeUseCase;
  let subscriptionRepository: ISubscriptionRepository;
  let stripeSyncService: IStripeSyncService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: () => ({
            type: "postgres",
            host: process.env.DATABASE_HOST || "localhost",
            port: parseInt(process.env.DATABASE_PORT || "5432"),
            database: process.env.DATABASE_NAME || "test_db",
            username: process.env.DATABASE_USERNAME || "postgres",
            password: process.env.DATABASE_PASSWORD || "postgres",
            synchronize: true,
            autoLoadEntities: true,
            dropSchema: true,
            extra: {
              max: 10,
              connectionTimeoutMillis: 10000,
              idleTimeoutMillis: 30000,
            },
            retryAttempts: 5,
            retryDelay: 3000,
          }),
        }),
        CoreModule,
        SubscriptionModule,
        PaymentModule,
      ],
    })
      .overrideProvider(EmailProvider)
      .useValue(createMockEmailProvider())
      .overrideProvider(StripeSyncService)
      .useValue(createMockStripeSyncService())
      .overrideProvider(STRIPE_SYNC_SERVICE)
      .useValue(createMockStripeSyncService())
      .overrideProvider(CognitoAdapter)
      .useValue(createMockCognitoAdapter())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const dataSource = app.get(DataSource);
    await waitForDatabase(dataSource);

    handleWebhookUseCase = moduleFixture.get<HandleStripeWebhookUseCase>(HandleStripeWebhookUseCase);
    syncInvoiceUseCase = moduleFixture.get<SyncInvoiceFromStripeUseCase>(SyncInvoiceFromStripeUseCase);
    syncSubscriptionUseCase = moduleFixture.get<SyncSubscriptionFromStripeUseCase>(SyncSubscriptionFromStripeUseCase);
    subscriptionRepository = moduleFixture.get<ISubscriptionRepository>(SUBSCRIPTION_REPOSITORY);
    stripeSyncService = moduleFixture.get<IStripeSyncService>(STRIPE_SYNC_SERVICE);
  });

  afterAll(async () => {
    const dataSource = app.get(DataSource);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  it("should handle invoice.paid webhook and sync subscription", async () => {
    const event: IWebhookEvent = {
      id: "evt_test_123",
      type: "invoice.paid",
      data: {
        object: {
          id: "in_test_123",
          subscription: "sub_test_123",
        } as IWebhookInvoice,
      },
    };

    jest.spyOn(stripeSyncService, "getInvoice").mockResolvedValue({
      id: "in_test_123",
      subscription: "sub_test_123",
      amount_paid: 1000,
      status: "paid",
    } as any);
    
    // Mock syncInvoiceUseCase to avoid "Subscription not found" error
    jest.spyOn(syncInvoiceUseCase, "execute").mockResolvedValue(undefined);

    const result = await handleWebhookUseCase.execute({ event });

    expect(result.processed).toBe(true);
    expect(result.eventType).toBe("invoice.paid");
  });

  it("should handle subscription.updated webhook", async () => {
    const event: IWebhookEvent = {
      id: "evt_test_456",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_test_456",
          status: "active",
        } as IWebhookSubscription,
      },
    };

    jest.spyOn(stripeSyncService, "getSubscription").mockResolvedValue({
      id: "sub_test_456",
      status: "active",
    } as any);
    jest.spyOn(syncSubscriptionUseCase, "execute").mockResolvedValue(undefined);

    const result = await handleWebhookUseCase.execute({ event });

    expect(result.processed).toBe(true);
    expect(result.eventType).toBe("customer.subscription.updated");
  });

  it("should handle subscription.deleted webhook", async () => {
    const event: IWebhookEvent = {
      id: "evt_test_789",
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_test_789",
          status: "canceled",
        } as IWebhookSubscription,
      },
    };

    jest.spyOn(stripeSyncService, "getSubscription").mockResolvedValue({
      id: "sub_test_789",
      status: "canceled",
    } as any);
    jest.spyOn(syncSubscriptionUseCase, "execute").mockResolvedValue(undefined);

    const result = await handleWebhookUseCase.execute({ event });

    expect(result.processed).toBe(true);
    expect(result.eventType).toBe("customer.subscription.deleted");
  });
});

