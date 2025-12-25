import { Injectable } from "@nestjs/common";
import { BaseUseCase, DomainError, IUseCase } from "src/core";
import type { ILoggerService } from "src/core";
import type { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import type { IUserRepository } from "src/modules/organization/domain/repositories/user.repository";
import { CreateEmailNotificationUseCase } from "src/modules/notification/application/use-cases/create-email-notification.use-case";
import { GetBillingPortalLinkUseCase } from "./GetBillingPortalLink.use-case";

import * as fs from "fs";
import * as path from "path";
import * as Handlebars from "handlebars";

export interface SendSubscriptionConfirmationEmailInput {
  subscriptionId: string;
  organizationId: string;
}

export interface SendSubscriptionConfirmationEmailOutput {
  success: boolean;
}

@Injectable()
export class SendSubscriptionConfirmationEmailUseCase
  extends BaseUseCase
  implements
    IUseCase<
      SendSubscriptionConfirmationEmailInput,
      SendSubscriptionConfirmationEmailOutput
    >
{
  constructor(
    logger: ILoggerService,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly userRepository: IUserRepository,
    private readonly createEmailNotificationUseCase: CreateEmailNotificationUseCase,
    private readonly getBillingPortalLinkUseCase: GetBillingPortalLinkUseCase
  ) {
    super(logger);
  }

  async execute(
    input: SendSubscriptionConfirmationEmailInput
  ): Promise<SendSubscriptionConfirmationEmailOutput> {
    const { subscriptionId, organizationId } = input;

    try {
      // Récupérer la subscription
      const subscription =
        await this.subscriptionRepository.findById(subscriptionId);

      if (!subscription) {
        throw new DomainError(
          "SUBSCRIPTION_NOT_FOUND",
          "Subscription not found",
          { subscriptionId }
        );
      }

      // Récupérer l'utilisateur pour obtenir son email
      const user = await this.userRepository.findById(subscription.userId);

      if (!user) {
        throw new DomainError("USER_NOT_FOUND", "User not found", {
          userId: subscription.userId,
        });
      }

      // Déterminer le nom du plan
      const planName =
        subscription.planId === "super-izzzi" ? "Super Izzzi" : "Izzzi";

      // Générer le lien du billing portal
      const billingPortalResult =
        await this.getBillingPortalLinkUseCase.execute({
          organizationId,
          userId: subscription.userId,
          returnUrl: `${process.env.FRONTEND_DOMAIN_URL || "http://localhost:3001"}/profile/admin`,
        });

      // Lire et traiter le template
      const templatePath = path.join(
        __dirname,
        "../../../../templates/subscription-confirmation.html"
      );

      if (!fs.existsSync(templatePath)) {
        throw new DomainError(
          "TEMPLATE_NOT_FOUND",
          "Email template not found",
          { templatePath }
        );
      }

      const templateContent = fs.readFileSync(templatePath, "utf-8");
      const template = Handlebars.compile(templateContent);

      // Remplacer les placeholders dans le template
      const htmlContent = template({
        planName,
        billingPortalUrl: billingPortalResult.url,
      });

      // Envoyer l'email
      await this.createEmailNotificationUseCase.execute({
        target: user.email,
        subject: `Votre abonnement à ${planName} est confirmé !`,
        template: htmlContent,
      });

      this.logger.info(
        `Subscription confirmation email sent to ${user.email} for subscription ${subscriptionId}`
      );

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (error instanceof Error && error.stack) {
        this.logger.error(errorMessage, error.stack);
      } else {
        this.logger.warn(errorMessage);
      }
      throw error;
    }
  }

  async withCompensation(): Promise<void> {
    // No compensation needed for email sending
  }
}
