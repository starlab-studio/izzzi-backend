import { BaseEventHandler, ILoggerService, UserRole } from "src/core";
import { ClassLimitReachedEvent } from "src/modules/class/domain/events/class-limit-reached.event";
import { GeneralUtils } from "src/utils/general.utils";
import { CreateEmailNotificationUseCase } from "../use-cases/create-email-notification.use-case";
import { IMembershipRepository } from "src/modules/organization/domain/repositories/membership.repository";
import { IUserRepository } from "src/modules/organization/domain/repositories/user.repository";
import { MembershipStatus } from "src/modules/organization/domain/types";

export class ClassLimitReachedEventHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    private readonly createEmailNotificationUseCase: CreateEmailNotificationUseCase,
    private readonly membershipRepository: IMembershipRepository,
    private readonly userRepository: IUserRepository,
  ) {
    super(logger);
  }

  async handle(event: ClassLimitReachedEvent): Promise<void> {
    try {
      const memberships = await this.membershipRepository.findByOrganization(
        event.payload.organizationId,
      );

      const adminMemberships = memberships.filter(
        (membership) =>
          membership.role === UserRole.ADMIN &&
          membership.status === MembershipStatus.ACTIVE,
      );

      if (adminMemberships.length === 0) {
        this.logger.warn(
          `No active admin members found for organization ${event.payload.organizationId}`,
        );
        return;
      }

      const adminEmails: string[] = [];
      for (const membership of adminMemberships) {
        const user = await this.userRepository.findById(membership.userId);
        if (user && user.email) {
          adminEmails.push(user.email);
        }
      }

      if (adminEmails.length === 0) {
        this.logger.warn(
          `No admin emails found for organization ${event.payload.organizationId}`,
        );
        return;
      }

      const frontendUrl =
        process.env.FRONTEND_URL ||
        process.env.FRONTEND_DOMAIN_URL ||
        "http://localhost:3001";
      const templateVars = {
        currentClassCount: event.payload.currentClassCount.toString(),
        maxClasses: event.payload.maxClasses.toString(),
        planName: event.payload.planName,
        subscriptionManagementUrl: `${frontendUrl}/dashboard/admin/subscription`,
        isPlural: parseInt(event.payload.currentClassCount.toString()) > 1,
      };

      const template = GeneralUtils.htmlTemplateReader(
        "class-limit-reached.html",
        templateVars,
      );
      const subject = "Limite de classes atteinte !";

      const emailPromises = adminEmails.map((email) =>
        this.createEmailNotificationUseCase.execute({
          subject,
          template,
          target: email,
        }),
      );

      await Promise.all(emailPromises);

      this.logger.info(
        `Class limit reached notification sent to ${adminEmails.length} admin(s) for organization ${event.payload.organizationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error handling class limit reached event: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack || "" : "",
      );
    }
  }

  canHandle(eventName: string): boolean {
    return eventName === "class.limit.reached";
  }
}
