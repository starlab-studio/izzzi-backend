import { type Cache } from "cache-manager";
import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { ICacheService } from "src/core/domain/services/cache.service";

@Injectable()
export class CacheStoreAdapter implements ICacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async get<T = any>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.clear();
  }

  async has(key: string): Promise<boolean> {
    const value = await this.cacheManager.get(key);
    return value !== undefined;
  }

  async mset(entries: Array<[string, any]>, ttl?: number): Promise<void> {
    await Promise.all(entries.map(([key, value]) => this.set(key, value, ttl)));
  }

  async mget<T = any>(...keys: string[]): Promise<(T | undefined)[]> {
    return await Promise.all(keys.map((key) => this.get<T>(key)));
  }
}
