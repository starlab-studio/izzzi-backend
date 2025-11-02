export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(id: string, entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}
