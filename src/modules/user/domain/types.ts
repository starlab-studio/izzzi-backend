export enum UserStatus {
  PENDING = "pending",
  ACTIVE = "active",
  FAILED = "failed",
  DISABLED = "disabled",
}

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  lastLogin?: Date;
  status: UserStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IUserCreate = Pick<IUser, "firstName" | "lastName" | "email"> & {
  organization: string;
};
