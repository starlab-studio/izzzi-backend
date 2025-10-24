import { IUser, IUserCreate, UserStatus } from "../types";

export class User implements IUser {
  public readonly id: string;
  public firstName: string;
  public lastName: string;
  public email: string;
  public phoneNumber?: string;
  public avatarUrl?: string;
  public lastLogin?: Date;
  public status: UserStatus;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(data: IUserCreate) {
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.email = data.email;
    this.status = UserStatus.PENDING;
  }
}
