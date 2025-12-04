export interface ICacheService {
  set<T = any>(key: string, value: T, ttl?: number): Promise<void>;

  get<T = any>(key: string): Promise<T | undefined>;

  del(key: string): Promise<void>;

  reset(): Promise<void>;

  has(key: string): Promise<boolean>;

  mset(entries: Array<[string, any]>, ttl?: number): Promise<void>;

  mget<T = any>(...keys: string[]): Promise<(T | undefined)[]>;
}
