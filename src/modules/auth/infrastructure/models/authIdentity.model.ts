import { Entity, Column } from "typeorm";

import { BaseModel } from "src/core";
import { IAuthIdentity } from "../../domain/types";

@Entity({ name: "auth_identities" })
export class AuthIdentity extends BaseModel implements IAuthIdentity {
  @Column({ type: "varchar", length: 45 })
  provider: string;

  @Column({ name: "provider_user_id", type: "varchar", length: 65 })
  providerUserId: string;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId: string;
}
