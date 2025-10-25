import { IUseCase, ILoggerService, IEventStore, BaseUseCase } from "src/core";

import { IAuthIdentityCreate, IAuthIdentity } from "../../domain/types";
import { IAuthIdentityRepository } from "../../domain/repositories/authIdentity.repository";
import { AuthDomainService } from "../../domain/services/auth.domain.service";
import { AuthIdentityCreatedEvent } from "../../domain/events/authIdentityCreated.event";
import { AuthIdentityFailedEvent } from "../../domain/events/authIdentityFailed.event";

export class CreateAuthIdentityUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly authDomainService: AuthDomainService,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly eventStore: IEventStore
  ) {
    super(logger);
  }

  async execute(data: IAuthIdentityCreate): Promise<IAuthIdentity> {
    try {
      this.authDomainService.canCreateAuthIdentity(data);
      const authIdentity = await this.authIdentityRepository.create({
        provider: data.provider,
        providerUserId: data.providerUserId,
      });

      const payload = { ...data, ...authIdentity };
      this.eventStore.publish(new AuthIdentityCreatedEvent(payload));

      return authIdentity;
    } catch (error) {
      this.eventStore.publish(
        new AuthIdentityFailedEvent({ username: data.email })
      );
      this.handleError(error);
    }
  }

  async withCompenstation(data: {
    username: string;
    authIdentityId: string;
  }): Promise<void> {
    try {
      await this.authIdentityRepository.delete(data.authIdentityId);
      this.eventStore.publish(
        new AuthIdentityFailedEvent({ username: data.username })
      );
    } catch (error) {
      // TODO : SETUP RETRY LOGIC HERE
      this.handleError(error);
    }
  }
}
