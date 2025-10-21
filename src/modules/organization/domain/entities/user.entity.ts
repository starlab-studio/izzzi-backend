import { IUser, UserStatus } from "../types";

export class User implements IUser {
  public readonly id: string;
  public firstName: string;
  public lastName: string;
  public email: string;
  public phoneNumber?: string | undefined;
  public avatarUrl?: string | undefined;
  public lastLogin?: Date | undefined;
  public status: UserStatus;
  public createdAt?: Date | undefined;
  public updatedAt?: Date | undefined;

  constructor(data: IUser) {
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.email = data.email;
    this.phoneNumber = data.phoneNumber;
    this.avatarUrl = data.avatarUrl;
    this.lastLogin = data.lastLogin;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
