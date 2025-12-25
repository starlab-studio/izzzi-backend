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
import { SendSubscriptionConfirmationEmailUseCase } from "../subscription/application/use-cases/SendSubscriptionConfirmationEmail.use-case";
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY,
} from "../subscription/domain/repositories/subscription.repository";

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
      useFactory: (
        syncInvoiceUseCase: SyncInvoiceFromStripeUseCase,
        sendConfirmationEmailUseCase: SendSubscriptionConfirmationEmailUseCase,
        subscriptionRepository: ISubscriptionRepository
      ) =>
        new InvoicePaidHandler(
          syncInvoiceUseCase,
          sendConfirmationEmailUseCase,
          subscriptionRepository
        ),
      inject: [
        SyncInvoiceFromStripeUseCase,
        SendSubscriptionConfirmationEmailUseCase,
        SUBSCRIPTION_REPOSITORY,
      ],
    },
    {
      provide: PaymentIntentSucceededHandler,
      useFactory: (
        syncSubscriptionUseCase: SyncSubscriptionFromStripeUseCase,
        syncInvoiceUseCase: SyncInvoiceFromStripeUseCase,
        stripeSyncService: StripeSyncService
      ) =>
        new PaymentIntentSucceededHandler(
          syncSubscriptionUseCase,
          syncInvoiceUseCase,
          stripeSyncService
        ),
      inject: [
        SyncSubscriptionFromStripeUseCase,
        SyncInvoiceFromStripeUseCase,
        StripeSyncService,
      ],
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
