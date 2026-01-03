import { Test, TestingModule } from "@nestjs/testing";
import { HandleStripeWebhookUseCase } from "src/modules/payment/application/use-cases/HandleStripeWebhook.use-case";
import { SyncInvoiceFromStripeUseCase } from "src/modules/subscription/application/use-cases/SyncInvoiceFromStripe.use-case";
import { SyncSubscriptionFromStripeUseCase } from "src/modules/subscription/application/use-cases/SyncSubscriptionFromStripe.use-case";
import { IStripeSyncService } from "src/modules/payment/domain/services/stripe-sync.service";
import { ILoggerService, LoggerService } from "src/core";
import { IWebhookEvent, IWebhookInvoice, IWebhookPaymentIntent, IWebhookSubscription } from "src/modules/payment/domain/types/webhook-event.types";

describe("HandleStripeWebhookUseCase", () => {
  let useCase: HandleStripeWebhookUseCase;
  let syncInvoiceUseCase: jest.Mocked<SyncInvoiceFromStripeUseCase>;
  let syncSubscriptionUseCase: jest.Mocked<SyncSubscriptionFromStripeUseCase>;
  let stripeSyncService: jest.Mocked<IStripeSyncService>;
  let logger: jest.Mocked<ILoggerService>;

  beforeEach(async () => {
    const mockSyncInvoice = {
      execute: jest.fn(),
    };

    const mockSyncSubscription = {
      execute: jest.fn(),
    };

    const mockStripeSync = {
      getInvoice: jest.fn(),
      getSubscription: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    };

    syncInvoiceUseCase = mockSyncInvoice as any;
    syncSubscriptionUseCase = mockSyncSubscription as any;
    stripeSyncService = mockStripeSync as any;
    logger = mockLogger as any;
    useCase = new HandleStripeWebhookUseCase(
      logger,
      syncInvoiceUseCase,
      syncSubscriptionUseCase,
      stripeSyncService
    );
  });

  it("should handle invoice.paid event", async () => {
    const event: IWebhookEvent = {
      id: "evt_123",
      type: "invoice.paid",
      data: {
        object: {
          id: "in_123",
          customer: "cus_123",
          amount_paid: 1000,
          status: "paid",
        } as IWebhookInvoice,
      },
    };

    const stripeInvoice = {
      id: "in_123",
      customer: "cus_123",
      amount_paid: 1000,
      status: "paid",
    };

    stripeSyncService.getInvoice.mockResolvedValue(stripeInvoice as any);
    syncInvoiceUseCase.execute.mockResolvedValue(undefined);

    const result = await useCase.execute({ event });

    expect(result.processed).toBe(true);
    expect(result.eventType).toBe("invoice.paid");
    expect(stripeSyncService.getInvoice).toHaveBeenCalledWith("in_123");
    expect(syncInvoiceUseCase.execute).toHaveBeenCalled();
  });

  it("should handle payment_intent.succeeded event", async () => {
    const event: IWebhookEvent = {
      id: "evt_123",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_123",
          invoice: "in_123",
          status: "succeeded",
        } as IWebhookPaymentIntent,
      },
    };

    const stripeInvoice = {
      id: "in_123",
      customer: "cus_123",
      amount_paid: 1000,
      status: "paid",
    };

    stripeSyncService.getInvoice.mockResolvedValue(stripeInvoice as any);
    syncInvoiceUseCase.execute.mockResolvedValue(undefined);

    const result = await useCase.execute({ event });

    expect(result.processed).toBe(true);
    expect(result.eventType).toBe("payment_intent.succeeded");
  });

  it("should handle customer.subscription.updated event", async () => {
    const event: IWebhookEvent = {
      id: "evt_123",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          status: "active",
          quantity: 5,
        } as IWebhookSubscription,
      },
    };

    const stripeSubscription = {
      id: "sub_123",
      status: "active",
      quantity: 5,
    };

    stripeSyncService.getSubscription.mockResolvedValue(stripeSubscription as any);
    syncSubscriptionUseCase.execute.mockResolvedValue(undefined);

    const result = await useCase.execute({ event });

    expect(result.processed).toBe(true);
    expect(result.eventType).toBe("customer.subscription.updated");
    expect(stripeSyncService.getSubscription).toHaveBeenCalledWith("sub_123");
    expect(syncSubscriptionUseCase.execute).toHaveBeenCalled();
  });

  it("should handle customer.subscription.deleted event", async () => {
    const event: IWebhookEvent = {
      id: "evt_123",
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_123",
          status: "canceled",
        } as IWebhookSubscription,
      },
    };

    syncSubscriptionUseCase.execute.mockResolvedValue(undefined);

    const result = await useCase.execute({ event });

    expect(result.processed).toBe(true);
    expect(result.eventType).toBe("customer.subscription.deleted");
  });

  it("should return unprocessed for unhandled event type", async () => {
    const event: IWebhookEvent = {
      id: "evt_123",
      type: "unknown.event",
      data: {
        object: {} as any,
      },
    };

    const result = await useCase.execute({ event });

    expect(result.processed).toBe(false);
    expect(result.eventType).toBe("unknown.event");
  });

  it("should handle errors gracefully", async () => {
    const event: IWebhookEvent = {
      id: "evt_123",
      type: "invoice.paid",
      data: {
        object: {
          id: "in_123",
        } as IWebhookInvoice,
      },
    };

    stripeSyncService.getInvoice.mockRejectedValue(new Error("Stripe error"));

    const result = await useCase.execute({ event });

    expect(result.processed).toBe(false);
    expect(logger.error).toHaveBeenCalled();
  });

  it("should handle invoice not found in Stripe", async () => {
    const event: IWebhookEvent = {
      id: "evt_123",
      type: "invoice.paid",
      data: {
        object: {
          id: "in_123",
        } as IWebhookInvoice,
      },
    };

    stripeSyncService.getInvoice.mockResolvedValue(null);

    const result = await useCase.execute({ event });

    expect(result.processed).toBe(true);
    expect(logger.error).toHaveBeenCalled();
  });

  it("should handle payment intent without invoice", async () => {
    const event: IWebhookEvent = {
      id: "evt_123",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_123",
          status: "succeeded",
        } as IWebhookPaymentIntent,
      },
    };

    const result = await useCase.execute({ event });

    expect(result.processed).toBe(true);
  });

  it("should handle payment intent with invoice object", async () => {
    const event: IWebhookEvent = {
      id: "evt_123",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_123",
          invoice: {
            id: "in_123",
          },
          status: "succeeded",
        } as IWebhookPaymentIntent,
      },
    };

    const stripeInvoice = {
      id: "in_123",
      customer: "cus_123",
      amount_paid: 1000,
      status: "paid",
    };

    stripeSyncService.getInvoice.mockResolvedValue(stripeInvoice as any);
    syncInvoiceUseCase.execute.mockResolvedValue(undefined);

    const result = await useCase.execute({ event });

    expect(result.processed).toBe(true);
    expect(stripeSyncService.getInvoice).toHaveBeenCalledWith("in_123");
  });

  it("should log processing start and completion", async () => {
    const event: IWebhookEvent = {
      id: "evt_123",
      type: "invoice.paid",
      data: {
        object: {
          id: "in_123",
        } as IWebhookInvoice,
      },
    };

    stripeSyncService.getInvoice.mockResolvedValue(null);

    await useCase.execute({ event });

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Processing Stripe webhook event")
    );
  });
});

