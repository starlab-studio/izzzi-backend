import { BaseService, Response, ILoggerService, IEventStore } from "src/core";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { IUser, IUserCreate } from "../../domain/types";
import { UserCreatedEvent } from "../events/userCreated.event";

export class UserService extends BaseService {
  constructor(
    readonly logger: ILoggerService,
    readonly eventStore: IEventStore,
    private readonly repository: IUserRepository
  ) {
    super(logger);
  }

  async getProfile(userId: string): Promise<Response<IUser | null>> {
    try {
      this.assert(!!userId, "User id is required to get profile");
      const user = await this.repository.findById(userId);
      this.assert(!!user, "User not found", { userId });

      return this.success(user);
    } catch (error) {
      this.handleError(error);
    }
  }

  async createUser(data: IUserCreate): Promise<IUser> {
    try {
      const existingUser = await this.repository.findByEmail(data.email);
      this.assert(!existingUser, "User email is already in use");

      const user = await this.repository.create(data);
      this.assert(!!user, "User create operation fail");

      this.eventStore.publish(new UserCreatedEvent(data));

      console.log("USER IS SUCCESSFULLY CREATED : ", user);

      return user;
    } catch (error) {
      console.log("SOMETHING WENT WRONG : ", error);
      this.handleError(error);
    }
  }
}
