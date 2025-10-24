import { IUseCase, ILoggerService, IEventStore, BaseUseCase } from "src/core";

import { IAuthIdentityCreate, IAuthIdentity } from "../../domain/types";
import { IAuthIdentityRepository } from "../../domain/repositories/authIdentity.repository";
import { AuthIdentityCreatedEvent } from "../../domain/events/AuthIdentityCreated.event";
import { AuthDomainService } from "../../domain/services/auth.domain.service";

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
      this.handleError(error);
    }
  }
}
