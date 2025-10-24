import { IAuthIdentity } from "../types";

export class AuthIdentityEntity implements IAuthIdentity {
  public readonly id: string;
  public provider: string;
  public providerUserId: string;
  public userId: string | null;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: IAuthIdentity) {
    this.provider = data.provider;
    this.providerUserId = data.providerUserId;
    this.userId = data.userId;
  }
}
