import { IAuthIdentity } from "../types";

export class AuthIdentityEntity implements IAuthIdentity {
  public readonly id: string;
  public provider: string;
  public provider_user_id: string;
  public user_id: string | null;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: IAuthIdentity) {
    this.provider = data.provider;
    this.provider_user_id = data.provider_user_id;
    this.user_id = data.user_id;
  }
}
