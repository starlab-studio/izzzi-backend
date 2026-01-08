export interface IUnitOfWork {
  withTransaction<T>(operation: (uow: IUnitOfWork) => Promise<T>): Promise<T>;
  getRepository<T>(repositoryClass: new (uow: IUnitOfWork) => T): T;
}
