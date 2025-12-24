import { DataSource, EntityManager } from "typeorm";
import { IUnitOfWork } from "src/core/application/interfaces/unit_of_work.interface";

export class TypeOrmUnitOfWork implements IUnitOfWork {
  private queryRunner?: any;
  private entityManager?: EntityManager;

  constructor(private readonly dataSource: DataSource) {}

  async withTransaction<T>(
    operation: (uow: IUnitOfWork) => Promise<T>
  ): Promise<T> {
    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
    this.entityManager = this.queryRunner.manager;

    try {
      const result = await operation(this);
      await this.queryRunner.commitTransaction();
      return result;
    } catch (error) {
      if (this.queryRunner && this.queryRunner.isTransactionActive) {
        await this.queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      if (this.queryRunner) {
        await this.queryRunner.release();
      }
      this.queryRunner = undefined;
      this.entityManager = undefined;
    }
  }

  getRepository<T>(repositoryClass: new (uow: IUnitOfWork) => T): T {
    if (!this.entityManager) {
      throw new Error(
        "No active transaction. Repository can only be accessed within a transaction."
      );
    }
    return new repositoryClass(this);
  }

  // Méthode interne pour accéder à l'EntityManager (pour les implémentations TypeORM)
  getEntityManager(): EntityManager {
    if (!this.entityManager) {
      throw new Error(
        "No active transaction. EntityManager can only be accessed within a transaction."
      );
    }
    return this.entityManager;
  }
}
