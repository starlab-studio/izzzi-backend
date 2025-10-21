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

export enum Role {
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
  MEMBER = "member",
}

export interface IOrganization {
  id: string;
  name: string;
  siren?: string | undefined;
  siret?: string | undefined;
  vat_number?: string | undefined;
  slug: string;
  owner: IUser;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserOrganization {
  id: string;
  user: IUser;
  organization: IOrganization;
  role: Role;
  createdAt?: Date;
  updatedAt?: Date;
}
