export interface IRepository<T> {
  create(entity: T): Promise<T>;
  findById(id: number): Promise<T | null>;
  findByUid(uid: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(entity: T): Promise<T>;
  delete(id: number): Promise<void>;
}
