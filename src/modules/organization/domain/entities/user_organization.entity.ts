import { IOrganization, IUser, IUserOrganization, Role } from "../types";

export class UserOrganizationEntity implements IUserOrganization {
  public readonly id: string;
  public user: IUser;
  public organization: IOrganization;
  public role: Role;
  public readonly createdAt?: Date | undefined;
  public readonly updatedAt?: Date | undefined;

  constructor(data: IUserOrganization) {
    this.user = data.user;
    this.organization = data.organization;
    this.role = data.role;
  }
}
