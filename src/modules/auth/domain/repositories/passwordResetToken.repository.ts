import { PasswordResetToken } from "../entities/passwordResetToken.entity";

export interface IPasswordResetTokenRepository {
  save(token: PasswordResetToken): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
  findByEmailAndNotUsed(email: string): Promise<PasswordResetToken | null>;
  deleteExpired(): Promise<number>;
  delete(id: string): Promise<void>;
}
