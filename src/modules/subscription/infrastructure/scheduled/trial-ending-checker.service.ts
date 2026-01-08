import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import type { ILoggerService } from "src/core";
import type { IEventStore } from "src/core";
import type { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import type { ISubscriptionPlanRepository } from "../../domain/repositories/subscription-plan.repository";
import type { IMembershipRepository } from "src/modules/organization/domain/repositories/membership.repository";
import type { IUserRepository } from "src/modules/organization/domain/repositories/user.repository";
import { UserRole } from "src/core";
import { MembershipStatus } from "src/modules/organization/domain/types";
import { TrialEndingSoonEvent } from "../../domain/events/trial-ending-soon.event";

@Injectable()
export class TrialEndingCheckerService {
  constructor(
    private readonly logger: ILoggerService,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly userRepository: IUserRepository,
    private readonly eventStore: IEventStore,
  ) {}

  @Cron("0 9 * * *")
  async checkTrialsEndingSoon(): Promise<void> {
    this.logger.info("Checking for trials ending in 7 days...");

    try {
      const subscriptions =
        await this.subscriptionRepository.findTrialsEndingIn(7);

      for (const subscription of subscriptions) {
        try {
          const plan = await this.subscriptionPlanRepository.findById(
            subscription.planId,
          );

          if (!plan || !plan.isFree) {
            continue;
          }

          const memberships =
            await this.membershipRepository.findByOrganization(
              subscription.organizationId,
            );

          const adminMemberships = memberships.filter(
            (membership) =>
              membership.role === UserRole.ADMIN &&
              membership.status === MembershipStatus.ACTIVE,
          );

          if (adminMemberships.length === 0) {
            this.logger.warn(
              `No active admin members found for organization ${subscription.organizationId}`,
            );
            continue;
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
              `No admin emails found for organization ${subscription.organizationId}`,
            );
            continue;
          }

          const planName =
            plan.name === "super-izzzi" ? "Super Izzzi" : "Izzzi";

          this.eventStore.publish(
            new TrialEndingSoonEvent({
              organizationId: subscription.organizationId,
              trialEndDate: subscription.trialEndDate!,
              planName,
              adminEmails,
            }),
          );

          this.logger.info(
            `Published TrialEndingSoonEvent for organization ${subscription.organizationId}`,
          );
        } catch (error) {
          this.logger.error(
            `Error processing subscription ${subscription.id}: ${
              error instanceof Error ? error.message : String(error)
            }`,
            error instanceof Error ? error.stack || "" : "",
          );
        }
      }

      this.logger.info(
        `Finished checking trials. Processed ${subscriptions.length} subscription(s).`,
      );
    } catch (error) {
      this.logger.error(
        `Error in checkTrialsEndingSoon: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack || "" : "",
      );
    }
  }
}
