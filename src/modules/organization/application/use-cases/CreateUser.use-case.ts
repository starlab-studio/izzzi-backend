import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  ApplicationError,
  EventStore,
  ErrorCode,
  DomainError,
} from "src/core";

import { UserEntity } from "../../domain/entities/user.entity";
import { IUser, IUserCreate } from "../../domain/types";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { UserFailedEvent } from "../../domain/events/userFailed.event";

export class CreateUserUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly eventStore: EventStore,
    private readonly userRepository: IUserRepository
  ) {
    super(logger);
  }

  async execute(data: IUserCreate): Promise<IUser> {
    try {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser)
        throw new DomainError(
          ErrorCode.USER_ALREADY_EXISTS,
          "User already exist"
        );

      const user = UserEntity.create({ ...data });
      const ormUser = await this.userRepository.create(user);
      if (!ormUser)
        throw new ApplicationError(
          ErrorCode.APPLICATION_FAILED_TO_CREATE,
          "Something went wrong during creation. Please try again later."
        );
      return ormUser;
    } catch (error) {
      this.eventStore.publish(
        new UserFailedEvent({
          username: data.email,
          authIdentityId: data.authIdentityId,
        })
      );
      this.handleError(error);
    }
  }

  async withCompensation(data: {
    username: string;
    authIdentityId: string;
  }): Promise<void> {
    this.eventStore.publish(
      new UserFailedEvent({
        username: data.username,
        authIdentityId: data.authIdentityId,
      })
    );
  }
}
