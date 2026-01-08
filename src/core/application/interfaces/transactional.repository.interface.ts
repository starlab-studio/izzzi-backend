import { IGenericRepository } from "./repository.interface";
import { IUnitOfWork } from "./unit_of_work.interface";

export type ITransactionalRepository<T> = IGenericRepository<T>;

export abstract class BaseTransactionalRepository<T>
  implements ITransactionalRepository<T>
{
  constructor(protected readonly unitOfWork: IUnitOfWork) {}

  abstract create(data: Partial<T>): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract save(entity: T): Promise<T>;
  abstract delete(id: string): Promise<void>;
  abstract findAll(): Promise<T[]>;
}
