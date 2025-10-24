import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  ApplicationError,
  EventStore,
  ErrorCode,
} from "src/core";

import { IUser, IUserCreate } from "../../domain/types";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { UserDomainService } from "../../domain/services/user.domain.service";
import {
  UserCreatedEvent,
  UserCreatedPayload,
} from "../../domain/events/userCreated.event";
import { User } from "../../domain/entities/user.entity";

export class CreateUserUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly eventStore: EventStore,
    private readonly userDomaineService: UserDomainService,
    private readonly userRepository: IUserRepository
  ) {
    super(logger);
  }

  async execute(data: IUserCreate): Promise<IUser> {
    try {
      const existingUser = await this.userRepository.findByEmail(data.email);
      this.userDomaineService.validateUserUniqueness(existingUser);

      const user = new User(data);
      const ormUser = await this.userRepository.create(user);
      if (!ormUser)
        throw new ApplicationError(
          ErrorCode.APPLICATION_FAILED_TO_CREATE,
          "Something went wrong during creation. Please try again later."
        );

      const payload = { id: ormUser.id, ...data } satisfies UserCreatedPayload;
      this.eventStore.publish(new UserCreatedEvent(payload));
      return ormUser;
    } catch (error) {
      this.handleError(error);
    }
  }
}
