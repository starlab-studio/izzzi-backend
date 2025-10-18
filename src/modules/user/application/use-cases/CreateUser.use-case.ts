import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  ApplicationError,
  EventStore,
} from "src/core";
import { IUser, IUserCreate } from "../../domain/types";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { UserDomainService } from "../../domain/services/user.domain.service";
import { UserCreatedEvent } from "../../domain/events/userCreated.event";

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

      const user = await this.userRepository.create(data);
      if (!user)
        throw new ApplicationError("Application failed to create user");

      this.eventStore.publish(new UserCreatedEvent({ id: user.id, ...data }));
      return user;
    } catch (error) {
      this.handleError(error);
    }
  }
}
