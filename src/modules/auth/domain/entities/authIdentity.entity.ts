import { IAuthIdentity } from "../types";

export class AuthIdentityEntity implements IAuthIdentity {
  public readonly id: string;
  public provider: string;
  public providerUserId: string;
  public username: string | null;
  public password: string | null;
  public userId: string | null;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(
    data: Pick<
      IAuthIdentity,
      "provider" | "providerUserId" | "username" | "password"
    >
  ) {
    this.provider = data.provider;
    this.providerUserId = data.providerUserId;
    this.username = data.username;
    this.password = data.password;
  }
}
