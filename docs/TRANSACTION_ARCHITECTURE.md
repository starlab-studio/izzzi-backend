# Architecture Transactionnelle - Documentation Technique

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Générale](#architecture-générale)
3. [Implémentation Détaillée](#implémentation-détaillée)
4. [Avantages](#avantages)
5. [Limites](#limites)
6. [Améliorations Possibles](#améliorations-possibles)
7. [Migration vers d'Autres ORMs](#migration-vers-dautres-orms)
8. [Exemples d'Usage](#exemples-dusage)

---

## Vue d'ensemble

Cette architecture implémente un **pattern Unit of Work** générique et portable qui permet de gérer les transactions de manière atomique tout en respectant les principes du Domain-Driven Design (DDD).

### Objectifs

- **Atomicité** : Toutes les opérations s'exécutent dans une seule transaction
- **Portabilité** : Fonctionne avec n'importe quel ORM (TypeORM, Prisma, Sequelize, etc.)
- **DDD Compliance** : Aucune dépendance framework dans les couches domaine/application
- **Testabilité** : Facile de mocker et tester
- **Flexibilité** : Changer d'ORM sans modifier le code métier

---

## Architecture Générale

### Diagramme de l'Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  OrganizationService                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ async createUserAndOrganization() {                 │   │
│  │   return await this.unitOfWork.withTransaction(     │   │
│  │     async (uow) => {                               │   │
│  │       // Toutes les opérations sont atomiques      │   │
│  │     }                                              │   │
│  │   );                                               │   │
│  │ }                                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    CORE LAYER                               │
├─────────────────────────────────────────────────────────────┤
│  IUnitOfWork (Interface Générique)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ interface IUnitOfWork {                             │   │
│  │   withTransaction<T>(operation: (uow) => Promise<T>) │   │
│  │   getRepository<T>(repositoryClass) => T            │   │
│  │ }                                                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  TypeOrmUnitOfWork (Implémentation TypeORM)                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ class TypeOrmUnitOfWork implements IUnitOfWork {   │   │
│  │   async withTransaction() {                         │   │
│  │     // Gestion des transactions TypeORM             │   │
│  │   }                                                 │   │
│  │ }                                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Composants Principaux

#### 1. **Interfaces Génériques (ORM-Agnostic)**

```typescript
// Interface générique pour le Unit of Work
export interface IUnitOfWork {
  withTransaction<T>(operation: (uow: IUnitOfWork) => Promise<T>): Promise<T>;
  getRepository<T>(repositoryClass: new (uow: IUnitOfWork) => T): T;
}

// Interface générique pour les repositories
export interface IGenericRepository<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  findAll(): Promise<T[]>;
}

// Interface pour les repositories transactionnels
export interface ITransactionalRepository<T> extends IGenericRepository<T> {}

// Classe abstraite de base
export abstract class BaseTransactionalRepository<T>
  implements ITransactionalRepository<T>
{
  constructor(protected readonly unitOfWork: IUnitOfWork) {}
  // Méthodes abstraites...
}
```

#### 2. **Implémentation TypeORM**

```typescript
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
      await this.queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await this.queryRunner.release();
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
}
```

#### 3. **Repositories Transactionnels**

```typescript
export class UserRepository
  extends BaseTransactionalRepository<IUser>
  implements IUserRepository
{
  constructor(unitOfWork: IUnitOfWork) {
    super(unitOfWork);
  }

  private getTypeOrmRepository(): Repository<UserModel> {
    const typeOrmUow = this.unitOfWork as any;
    return typeOrmUow.getEntityManager().getRepository(UserModel);
  }

  async create(data: IUser): Promise<IUser> {
    const repository = this.getTypeOrmRepository();
    const entity = repository.create(data);
    return await repository.save(entity);
  }
  // ... autres méthodes
}
```

---

## Implémentation Détaillée

### 1. **Configuration du Module**

```typescript
// organization.module.ts
@Module({
  providers: [
    {
      provide: "USER_REPOSITORY",
      useFactory: (unitOfWork: IUnitOfWork) => new UserRepository(unitOfWork),
      inject: [TypeOrmUnitOfWork],
    },
    {
      provide: "ORGANIZATION_REPOSITORY",
      useFactory: (unitOfWork: IUnitOfWork) =>
        new OrganizationRepository(unitOfWork),
      inject: [TypeOrmUnitOfWork],
    },
    {
      provide: "MEMBERSHIP_REPOSITORY",
      useFactory: (unitOfWork: IUnitOfWork) =>
        new MembershipRepository(unitOfWork),
      inject: [TypeOrmUnitOfWork],
    },
  ],
})
export class OrganizationModule {}
```

### 2. **Usage dans les Services**

```typescript
export class OrganizationService {
  constructor(
    private readonly unitOfWork: IUnitOfWork,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly addUserToOrganizationUseCase: AddUserToOrganizationUseCase
  ) {}

  async createUserAndOrganization(data: IUserCreate): Promise<IUser> {
    return await this.unitOfWork.withTransaction(async (uow) => {
      // Toutes ces opérations sont dans la même transaction
      const user = await this.createUserUseCase.execute(data);
      const organization = await this.createOrganizationUseCase.execute({
        name: data.organization,
        ownerId: user.id,
      });
      await this.addUserToOrganizationUseCase.execute({
        userId: user.id,
        organizationId: organization.id,
        role: Role.ADMIN,
        addedBy: null,
      });
      return user;
    });
  }
}
```

### 3. **Gestion des Transactions**

#### **Démarrage de Transaction**

```typescript
// 1. Création du QueryRunner
this.queryRunner = this.dataSource.createQueryRunner();

// 2. Connexion à la base de données
await this.queryRunner.connect();

// 3. Démarrage de la transaction
await this.queryRunner.startTransaction();

// 4. Récupération de l'EntityManager transactionnel
this.entityManager = this.queryRunner.manager;
```

#### **Exécution des Opérations**

```typescript
// Toutes les opérations utilisent le même EntityManager
const repository = this.entityManager.getRepository(UserModel);
const user = await repository.save(userData);
```

#### **Finalisation de Transaction**

```typescript
try {
  // Exécution des opérations
  const result = await operation(this);

  // Commit si tout s'est bien passé
  await this.queryRunner.commitTransaction();
  return result;
} catch (error) {
  // Rollback en cas d'erreur
  await this.queryRunner.rollbackTransaction();
  throw error;
} finally {
  // Libération des ressources
  await this.queryRunner.release();
  this.queryRunner = undefined;
  this.entityManager = undefined;
}
```

---

## Avantages

### 1. **Atomicité Garantie**

- Toutes les opérations s'exécutent dans une seule transaction
- En cas d'erreur, tout est annulé automatiquement
- Pas de données partiellement sauvegardées

### 2. **Respect du DDD**

- Aucune dépendance framework dans les couches domaine/application
- Séparation claire des responsabilités
- Code métier indépendant de l'infrastructure

### 3. **Portabilité**

- Fonctionne avec TypeORM, Prisma, Sequelize, etc.
- Migration facile vers un autre ORM
- Code métier inchangé lors du changement d'ORM

### 4. **Testabilité**

- Facile de mocker `IUnitOfWork`
- Tests unitaires sans base de données
- Tests d'intégration avec vraies transactions

### 5. **Flexibilité**

- Repositories réutilisables
- Configuration flexible
- Extension facile

---

## Limites

### 1. **Complexité d'Initialisation**

- Configuration plus complexe que l'injection TypeORM standard
- Nécessite une compréhension du pattern Unit of Work
- Plus de code boilerplate

### 2. **Performance**

- Overhead léger pour la gestion des transactions
- Casting `as any` pour accéder aux méthodes spécifiques à l'ORM
- Création d'instances de repositories à chaque opération

### 3. **Debugging**

- Stack traces plus complexes
- Plus difficile de tracer les problèmes de transaction
- Logs moins explicites

### 4. **Dépendances**

- Repositories dépendent du Unit of Work
- Pas d'utilisation directe des repositories en dehors des transactions
- Configuration manuelle des injections

---

## Améliorations Possibles

### 1. **Cache des Repositories**

```typescript
export class TypeOrmUnitOfWork implements IUnitOfWork {
  private repositoryCache = new Map<string, any>();

  getRepository<T>(repositoryClass: new (uow: IUnitOfWork) => T): T {
    const cacheKey = repositoryClass.name;

    if (!this.repositoryCache.has(cacheKey)) {
      this.repositoryCache.set(cacheKey, new repositoryClass(this));
    }

    return this.repositoryCache.get(cacheKey);
  }
}
```

### 2. **Logging Amélioré**

```typescript
export class TypeOrmUnitOfWork implements IUnitOfWork {
  async withTransaction<T>(
    operation: (uow: IUnitOfWork) => Promise<T>
  ): Promise<T> {
    const transactionId = uuidv4();
    this.logger.debug(`Starting transaction ${transactionId}`);

    try {
      const result = await operation(this);
      this.logger.debug(`Transaction ${transactionId} committed successfully`);
      return result;
    } catch (error) {
      this.logger.error(
        `Transaction ${transactionId} rolled back: ${error.message}`
      );
      throw error;
    }
  }
}
```

### 3. **Métriques et Monitoring**

```typescript
export class TypeOrmUnitOfWork implements IUnitOfWork {
  async withTransaction<T>(
    operation: (uow: IUnitOfWork) => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await operation(this);
      const duration = Date.now() - startTime;
      this.metricsService.recordTransactionSuccess(duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metricsService.recordTransactionFailure(duration, error);
      throw error;
    }
  }
}
```

### 4. **Retry Logic**

```typescript
export class TypeOrmUnitOfWork implements IUnitOfWork {
  async withTransaction<T>(
    operation: (uow: IUnitOfWork) => Promise<T>,
    retryCount: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        return await this.executeTransaction(operation);
      } catch (error) {
        if (this.isRetryableError(error) && attempt < retryCount) {
          await this.delay(Math.pow(2, attempt) * 100); // Exponential backoff
          continue;
        }
        throw error;
      }
    }
  }
}
```

### 5. **Validation des Transactions**

```typescript
export class TypeOrmUnitOfWork implements IUnitOfWork {
  async withTransaction<T>(
    operation: (uow: IUnitOfWork) => Promise<T>
  ): Promise<T> {
    this.validateTransactionContext();

    try {
      const result = await operation(this);
      this.validateTransactionResult(result);
      return result;
    } catch (error) {
      this.handleTransactionError(error);
      throw error;
    }
  }
}
```

---

## Migration vers d'Autres ORMs

### **Avec Prisma**

```typescript
export class PrismaUnitOfWork implements IUnitOfWork {
  constructor(private prisma: PrismaClient) {}

  async withTransaction<T>(
    operation: (uow: IUnitOfWork) => Promise<T>
  ): Promise<T> {
    return await this.prisma.$transaction(async (tx) => {
      this.currentTransaction = tx;
      try {
        return await operation(this);
      } finally {
        this.currentTransaction = null;
      }
    });
  }

  getPrismaClient() {
    return this.currentTransaction || this.prisma;
  }
}

// Repository avec Prisma
export class UserRepository extends BaseTransactionalRepository<IUser> {
  async create(data: IUser): Promise<IUser> {
    const prisma = this.getPrismaClient();
    return await prisma.user.create({ data });
  }
}
```

### **Avec Sequelize**

```typescript
export class SequelizeUnitOfWork implements IUnitOfWork {
  constructor(private sequelize: Sequelize) {}

  async withTransaction<T>(
    operation: (uow: IUnitOfWork) => Promise<T>
  ): Promise<T> {
    return await this.sequelize.transaction(async (transaction) => {
      this.currentTransaction = transaction;
      try {
        return await operation(this);
      } finally {
        this.currentTransaction = null;
      }
    });
  }

  getTransaction(): Transaction {
    return this.currentTransaction;
  }
}
```

---

## Exemples d'Usage

### **Cas d'Usage Simple**

```typescript
// Service simple avec une seule opération
export class UserService {
  constructor(private unitOfWork: IUnitOfWork) {}

  async createUser(userData: IUserCreate): Promise<IUser> {
    return await this.unitOfWork.withTransaction(async (uow) => {
      const userRepository = uow.getRepository(UserRepository);
      return await userRepository.create(userData);
    });
  }
}
```

### **Cas d'Usage Complexe**

```typescript
// Service complexe avec plusieurs opérations
export class OrderService {
  constructor(
    private unitOfWork: IUnitOfWork,
    private userRepository: IUserRepository,
    private orderRepository: IOrderRepository,
    private paymentRepository: IPaymentRepository
  ) {}

  async processOrder(orderData: IOrderCreate): Promise<IOrder> {
    return await this.unitOfWork.withTransaction(async (uow) => {
      // 1. Créer l'utilisateur
      const user = await this.userRepository.create(orderData.user);

      // 2. Créer la commande
      const order = await this.orderRepository.create({
        ...orderData,
        userId: user.id,
      });

      // 3. Traiter le paiement
      const payment = await this.paymentRepository.create({
        orderId: order.id,
        amount: order.total,
      });

      // 4. Mettre à jour le statut
      await this.orderRepository.update(order.id, {
        status: "PAID",
        paymentId: payment.id,
      });

      return order;
    });
  }
}
```

### **Gestion d'Erreurs**

```typescript
export class InventoryService {
  async updateInventory(productId: string, quantity: number): Promise<void> {
    try {
      await this.unitOfWork.withTransaction(async (uow) => {
        const inventory =
          await this.inventoryRepository.findByProductId(productId);

        if (inventory.stock < quantity) {
          throw new InsufficientStockError(
            `Stock insuffisant: ${inventory.stock} < ${quantity}`
          );
        }

        await this.inventoryRepository.updateStock(
          productId,
          inventory.stock - quantity
        );
        await this.inventoryRepository.logTransaction(productId, -quantity);
      });
    } catch (error) {
      if (error instanceof InsufficientStockError) {
        // Gestion spécifique des erreurs métier
        this.logger.warn(`Stock insuffisant pour le produit ${productId}`);
        throw new BusinessError("Stock insuffisant");
      }
      throw error;
    }
  }
}
```

---

## 🎯 Conclusion

Cette architecture transactionnelle offre une solution robuste et portable pour la gestion des transactions dans une application NestJS respectant les principes du DDD. Elle permet de :

- **Garantir l'atomicité** des opérations complexes
- **Respecter le DDD** en séparant les couches
- **Faciliter la migration** vers d'autres ORMs
- **Améliorer la testabilité** du code
- **Maintenir la flexibilité** de l'architecture

Bien qu'elle introduise une certaine complexité, les avantages en termes de maintenabilité, testabilité et portabilité justifient largement son adoption pour des applications complexes nécessitant une gestion transactionnelle robuste.
