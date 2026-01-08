import { RefreshToken } from "../entities/refreshToken.entity";

export interface IRefreshTokenRepository {
  save(token: RefreshToken): Promise<void>;
  findById(id: string): Promise<RefreshToken | null>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  findActiveByUserId(userId: string): Promise<RefreshToken[]>;
  countActiveByUserId(userId: string): Promise<number>;
  revokeAllByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
  delete(id: string): Promise<void>;
}
