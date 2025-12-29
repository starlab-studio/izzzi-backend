import { BaseEventHandler, ILoggerService } from "src/core";
import { SendSubscriptionConfirmationEmailUseCase } from "../../../subscription/application/use-cases/SendSubscriptionConfirmationEmail.use-case";
import { SubscriptionActivatedEvent } from "../../../subscription/domain/events/subscription-activated.event";

export class SubscriptionActivatedEventHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    private readonly sendSubscriptionConfirmationEmailUseCase: SendSubscriptionConfirmationEmailUseCase
  ) {
    super(logger);
  }

  async handle(event: SubscriptionActivatedEvent): Promise<void> {
    try {
      await this.sendSubscriptionConfirmationEmailUseCase.execute({
        subscriptionId: event.payload.subscriptionId,
        organizationId: event.payload.organizationId,
      });
      this.logger.info(
        `Subscription confirmation email sent for subscription ${event.payload.subscriptionId}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to send subscription confirmation email: ${errorMessage}`,
        errorStack || ""
      );
      // Ne pas throw pour éviter de bloquer l'event
    }
  }

  canHandle(eventName: string): boolean {
    return eventName === "subscription.activated";
  }
}
