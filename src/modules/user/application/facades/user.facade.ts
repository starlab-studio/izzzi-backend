import {
  GetProfileInput,
  GetProfileOutput,
  UpdateProfileInput,
  UpdateProfileOutput,
  DeleteAccountInput,
} from "../../domain/types";
import { GetProfileUseCase } from "../use-cases/GetProfile.use-case";
import { UpdateProfileUseCase } from "../use-cases/UpdateProfile.use-case";
import { DeleteAccountUseCase } from "../use-cases/DeleteAccount.use-case";

export class UserFacade {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase
  ) {}

  async getProfile(data: GetProfileInput): Promise<GetProfileOutput> {
    try {
      return await this.getProfileUseCase.execute(data);
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(data: UpdateProfileInput): Promise<UpdateProfileOutput> {
    try {
      return await this.updateProfileUseCase.execute(data);
    } catch (error) {
      throw error;
    }
  }

  async deleteAccount(data: DeleteAccountInput): Promise<void> {
    try {
      return await this.deleteAccountUseCase.execute(data);
    } catch (error) {
      throw error;
    }
  }
}

