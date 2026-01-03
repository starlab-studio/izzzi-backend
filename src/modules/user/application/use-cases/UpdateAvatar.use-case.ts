import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";

import { UpdateAvatarInput, UpdateAvatarOutput } from "../../domain/types";
import { IUserRepository } from "../../../organization/domain/repositories/user.repository";

export class UpdateAvatarUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly userRepository: IUserRepository
  ) {
    super(logger);
  }

  async execute(data: UpdateAvatarInput): Promise<UpdateAvatarOutput> {
    try {
      const user = await this.userRepository.findById(data.userId);
      if (!user) {
        throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      user.updateProfile({ avatarUrl: data.avatarUrl });
      await this.userRepository.save(user);

      return user.toPersistence();
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}

