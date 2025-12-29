import { BaseEventHandler, ILoggerService } from "src/core";
import { SubscriptionUpgradedEvent } from "src/modules/subscription/domain/events/subscription-upgraded.event";
import { GeneralUtils } from "src/utils/general.utils";
import { CreateEmailNotificationUseCase } from "../use-cases/create-email-notification.use-case";

export class SubscriptionUpgradedEventHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    private readonly createEmailNotificationUseCase: CreateEmailNotificationUseCase
  ) {
    super(logger);
  }

  async handle(event: SubscriptionUpgradedEvent): Promise<void> {
    try {
      const frontendUrl =
        process.env.FRONTEND_URL ||
        process.env.FRONTEND_DOMAIN_URL ||
        "http://localhost:3001";

      const previousPriceFormatted = (event.payload.previousPriceCents / 100)
        .toFixed(2)
        .replace(".", ",");
      const newPriceFormatted = (event.payload.newPriceCents / 100)
        .toFixed(2)
        .replace(".", ",");

      const templateVars = {
        planName: event.payload.planName,
        previousQuantity: event.payload.previousQuantity.toString(),
        newQuantity: event.payload.newQuantity.toString(),
        previousPriceFormatted,
        newPriceFormatted,
        subscriptionManagementUrl: `${frontendUrl}/dashboard/admin/subscription`,
      };

      const template = GeneralUtils.htmlTemplateReader(
        "subscription-upgraded.html",
        templateVars
      );
      const subject = "Votre abonnement a été mis à jour avec succès";

      await this.createEmailNotificationUseCase.execute({
        subject,
        template,
        target: event.payload.userEmail,
      });

      this.logger.info(
        `Subscription upgrade notification sent to ${event.payload.userEmail} for organization ${event.payload.organizationId}`
      );
    } catch (error) {
      this.logger.error(
        `Error handling subscription upgraded event: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack || "" : ""
      );
    }
  }

  canHandle(eventName: string): boolean {
    return eventName === "subscription.upgraded";
  }
}
