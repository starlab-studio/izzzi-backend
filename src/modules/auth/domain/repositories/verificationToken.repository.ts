import { VerificationTokenType } from "../types";
import { VerificationTokenEntity } from "../entities/verificationToken.entity";

export interface IVerificationTokenRepository {
  create(data: VerificationTokenEntity): Promise<VerificationTokenEntity>;

  findByEmailAndType(
    email: string,
    type: VerificationTokenType,
  ): Promise<VerificationTokenEntity | null>;

  findByToken(token: string): Promise<VerificationTokenEntity | null>;

  save(entity: VerificationTokenEntity): Promise<VerificationTokenEntity>;

  deleteExpired(): Promise<void>;

  deleteByEmailAndType(
    email: string,
    type: VerificationTokenType,
  ): Promise<void>;
}
