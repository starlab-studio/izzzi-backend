import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CoreModule } from "src/core/core.module";
import { StripeSyncService } from "./infrastructure/services/stripe-sync.service";
import {
  IStripeSyncService,
  STRIPE_SYNC_SERVICE,
} from "./domain/services/stripe-sync.service";
import { StripeWebhookController } from "./interface/controllers/stripe-webhook.controller";
import { HandleStripeWebhookUseCase } from "./application/use-cases/HandleStripeWebhook.use-case";
import { SubscriptionModule } from "../subscription/subscription.module";
import { SyncInvoiceFromStripeUseCase } from "../subscription/application/use-cases/SyncInvoiceFromStripe.use-case";
import { SyncSubscriptionFromStripeUseCase } from "../subscription/application/use-cases/SyncSubscriptionFromStripe.use-case";
import { LoggerService, ILoggerService } from "src/core";
import { SubscriptionRepository } from "../subscription/infrastructure/repositories/subscription.repository";
import { PricingTierRepository } from "../subscription/infrastructure/repositories/pricing-tier.repository";
import { InvoiceRepository } from "../subscription/infrastructure/repositories/invoice.repository";

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => CoreModule),
    forwardRef(() => SubscriptionModule),
  ],
  controllers: [StripeWebhookController],
  providers: [
    LoggerService,
    {
      provide: StripeSyncService,
      useFactory: (configService: ConfigService) => {
        return new StripeSyncService(configService);
      },
      inject: [ConfigService],
    },
    {
      provide: STRIPE_SYNC_SERVICE,
      useExisting: StripeSyncService,
    },
    {
      provide: HandleStripeWebhookUseCase,
      useFactory: (
        logger: ILoggerService,
        syncInvoiceUseCase: SyncInvoiceFromStripeUseCase,
        syncSubscriptionUseCase: SyncSubscriptionFromStripeUseCase,
        stripeSyncService: IStripeSyncService,
        subscriptionRepository: SubscriptionRepository,
        pricingTierRepository: PricingTierRepository,
        invoiceRepository: InvoiceRepository,
      ) =>
        new HandleStripeWebhookUseCase(
          logger,
          syncInvoiceUseCase,
          syncSubscriptionUseCase,
          stripeSyncService,
          subscriptionRepository,
          pricingTierRepository,
          invoiceRepository,
        ),
      inject: [
        LoggerService,
        SyncInvoiceFromStripeUseCase,
        SyncSubscriptionFromStripeUseCase,
        STRIPE_SYNC_SERVICE,
        SubscriptionRepository,
        PricingTierRepository,
        InvoiceRepository,
      ],
    },
  ],
  exports: [StripeSyncService, STRIPE_SYNC_SERVICE],
})
export class PaymentModule {}
