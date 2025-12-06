export enum UserRole {
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
  LEARNING_MANAGER = "learning_manager",
}

export type JWTPayload = {
  sub: string;
  userId: string;
  username: string;
  roles: { organizationId: string; role: UserRole }[];
};
