import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CoreModule } from "src/core/core.module";
import { StripeSyncService } from "./infrastructure/services/stripe-sync.service";
import { StripeWebhookController } from "./interface/controllers/stripe-webhook.controller";
import { InvoicePaidHandler } from "./application/handlers/invoice-paid.handler";
import { PaymentIntentSucceededHandler } from "./application/handlers/payment-intent-succeeded.handler";
import { SubscriptionUpdatedHandler } from "./application/handlers/subscription-updated.handler";
import { SubscriptionDeletedHandler } from "./application/handlers/subscription-deleted.handler";
import { SubscriptionModule } from "../subscription/subscription.module";
import { SyncInvoiceFromStripeUseCase } from "../subscription/application/use-cases/SyncInvoiceFromStripe.use-case";
import { SyncSubscriptionFromStripeUseCase } from "../subscription/application/use-cases/SyncSubscriptionFromStripe.use-case";

@Module({
  imports: [ConfigModule, CoreModule, forwardRef(() => SubscriptionModule)],
  controllers: [StripeWebhookController],
  providers: [
    {
      provide: StripeSyncService,
      useFactory: (configService: ConfigService) => {
        return new StripeSyncService(configService);
      },
      inject: [ConfigService],
    },
    {
      provide: InvoicePaidHandler,
      useFactory: (syncInvoiceUseCase: SyncInvoiceFromStripeUseCase) =>
        new InvoicePaidHandler(syncInvoiceUseCase),
      inject: [SyncInvoiceFromStripeUseCase],
    },
    {
      provide: PaymentIntentSucceededHandler,
      useFactory: (
        syncSubscriptionUseCase: SyncSubscriptionFromStripeUseCase
      ) => new PaymentIntentSucceededHandler(syncSubscriptionUseCase),
      inject: [SyncSubscriptionFromStripeUseCase],
    },
    {
      provide: SubscriptionUpdatedHandler,
      useFactory: (
        syncSubscriptionUseCase: SyncSubscriptionFromStripeUseCase
      ) => new SubscriptionUpdatedHandler(syncSubscriptionUseCase),
      inject: [SyncSubscriptionFromStripeUseCase],
    },
    {
      provide: SubscriptionDeletedHandler,
      useFactory: (
        syncSubscriptionUseCase: SyncSubscriptionFromStripeUseCase
      ) => new SubscriptionDeletedHandler(syncSubscriptionUseCase),
      inject: [SyncSubscriptionFromStripeUseCase],
    },
  ],
  exports: [StripeSyncService],
})
export class PaymentModule {}
