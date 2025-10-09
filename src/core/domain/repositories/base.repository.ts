export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}
