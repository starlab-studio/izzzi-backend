import { SetMetadata } from "@nestjs/common";

export enum Role {
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
  MEMBER = "member",
}

export const ROLES_KEY = "roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
