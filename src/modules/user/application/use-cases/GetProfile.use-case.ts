import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";

import { GetProfileInput, GetProfileOutput } from "../../domain/types";
import { IUserRepository } from "../../../organization/domain/repositories/user.repository";

export class GetProfileUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly userRepository: IUserRepository,
  ) {
    super(logger);
  }

  async execute(data: GetProfileInput): Promise<GetProfileOutput> {
    try {
      const user = await this.userRepository.findById(data.userId);
      if (!user) {
        throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      return user.toPersistence();
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
