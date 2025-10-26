# Izzzi Backend

[![NestJS](https://img.shields.io/badge/NestJS-11.0.1-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TypeORM](https://img.shields.io/badge/TypeORM-0.3.27-FA5252?style=flat-square&logo=typeorm&logoColor=white)](https://typeorm.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-8.16.3-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

> **Modern Backend API** built with NestJS, TypeScript and DDD (Domain-Driven Design) architecture with advanced transactional management.

## Table of Contents

- [Overview](#-overview)
- [Architecture](#️-architecture)
- [Features](#-features)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Available Scripts](#-available-scripts)
- [Database](#️-database)
- [Testing](#-testing)
- [Docker](#-docker)
- [Documentation](#-documentation)
- [Contributing](#-contributing)

---

## Overview

Izzzi Backend is a modern REST API built with **NestJS** and **TypeScript**, implementing a **Domain-Driven Design (DDD)** architecture with advanced and portable transactional management.

### **Key Features**

- **DDD Architecture** : Clear separation of domain, application and infrastructure layers
- **Transactional Management** : Generic and portable Unit of Work pattern
- **Multi-ORM Support** : Compatible with TypeORM, Prisma, Sequelize, etc.
- **REST API** : Documented endpoints with Swagger
- **Authentication** : AWS Cognito integration
- **Queue System** : Asynchronous task management with BullMQ
- **Docker Ready** : Containerized deployment
- **Complete Testing** : Unit and integration tests

---

## Architecture

### **Project Structure**

```
src/
├── core/                          # Core layer (shared)
│   ├── application/               # Application interfaces and services
│   │   ├── handlers/             # Event handlers
│   │   ├── interfaces/           # Generic interfaces
│   │   └── services/             # Application services
│   ├── domain/                   # Pure business logic
│   │   ├── errors/               # Business errors
│   │   ├── events/               # Domain events
│   │   └── repositories/         # Repository interfaces
│   └── infrastructure/           # Technical implementations
│       ├── exceptions/           # Exception handlers
│       ├── services/             # Infrastructure services
│       └── unit-of-work/         # Transaction management
├── modules/                      # Business modules
│   ├── auth/                     # Authentication module
│   └── organization/             # Organization module
└── migrations/                   # Database migrations
```

### **Implemented Patterns**

- **Domain-Driven Design (DDD)**
- **Unit of Work Pattern**
- **Repository Pattern**
- **Event-Driven Architecture**
- **CQRS (Command Query Responsibility Segregation)**

---

## Features

### **Authentication & Authorization**

- Factory pattern for multi auth provider support
- AWS Cognito integration
- User identity management
- Role and permission system

### **Organization Management**

- Organization creation and management
- Membership system
- User roles within organizations

### **Transactional Management**

- Atomic transactions
- Portable Unit of Work pattern
- Multi-ORM support

### **Event System & SAGA pattern**

- Domain events
- Event handlers
- Queue system with BullMQ
- Saga pattern to compensate on failure

### **Monitoring & Logging**

- Structured logging
- Performance metrics
- Centralized error handling

---

## Installation

### **Prerequisites**

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **PostgreSQL** >= 18.0
- **Redis** >= 7.0 (for BullMQ)

### **Install Dependencies**

# Clone the repository

git clone [https://github.com/starlab-studio/izzzi-backend](https://github.com/starlab-studio/izzzi-backend)

# Install dependencies

```bash
npm install
```

### **Environment Variables**

Create a `.env` file at the project root:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=izzzi_db
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS Cognito
AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=your_pool_id
AWS_COGNITO_CLIENT_ID=your_client_id

# Application
PORT=3000
NODE_ENV=development
```

---

## Configuration

### **Database Configuration**

The project uses TypeORM with PostgreSQL. Configuration is located in `src/data-source.ts`.

### **Module Configuration**

Each module is configured in its own module file:

- `src/modules/auth/auth.module.ts`
- `src/modules/organization/organization.module.ts`

---

## Available Scripts

### **Development**

```bash
# Start in development mode
npm run start:dev

# Start in debug mode
npm run start:debug

# Start in production mode
npm run start:prod
```

### **🏗️ Build & Compilation**

```bash
# Compile the project
npm run build

# Format code
npm run format

# Linter
npm run lint
```

### **Database**

```bash
# Generate a migration
npm run migration:generate -- src/migrations/MigrationName

# Create an empty migration
npm run migration:create -- src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### **Testing**

```bash
# Unit tests
npm run test

# Tests in watch mode
npm run test:watch

# Tests with coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Tests in debug mode
npm run test:debug
```

---

## Database

### **Main Models**

- **User** : System users
- **AuthIdentity** : Authentication identities
- **Organization** : Organizations
- **Membership** : Organization memberships

### **Migrations**

Migrations are managed with TypeORM. Each migration is versioned and can be applied/reverted.

```bash
# View migration status
npm run migration:show

# Apply all migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

---

## Testing

### **Test Structure**

```
test/
├── unit/              # Unit tests
├── integration/       # Integration tests
└── e2e/              # End-to-end tests
```

### **Running Tests**

```bash
# All tests
npm test

# Tests with coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

---

## Docker

### **Docker Compose**

The project includes a Docker Compose configuration for development:

```bash
# Start all services
docker-compose up -d

# Stop services
docker-compose down
```

### **Included Services**

- **PostgreSQL** : Main database
- **Redis** : Cache and queue system
- **Application** : NestJS API

### **Dockerfile**

The project includes an optimized Dockerfile for production:

```bash
# Build the image
docker build -t izzzi-backend .

# Run the container
docker run -p 3000:3000 izzzi-backend
```

---

## Documentation

### **Technical Documentation**

- [Transactional Architecture](./docs/TRANSACTION_ARCHITECTURE.md) - Complete documentation on transaction management

### **API Documentation**

Once the application is started, Swagger documentation is available at:

- **Development** : http://localhost:3000/api
- **Production** : https://www.izzzi.com/api

### **Main Endpoints**

#### **Authentication**

```
POST /v1/auth/signUp          # Registration
POST /v1/auth/signIn          # Login
POST /v1/auth/refresh         # Refresh token
```

#### **👥 Users**

```
GET    /v1/users              # List users
GET    /v1/users/:id          # User details
PUT    /v1/users/:id          # Update user
DELETE /v1/users/:id          # Delete user
```

#### **Organizations**

```
GET    /v1/organizations      # List organizations
POST   /v1/organizations      # Create organization
GET    /v1/organizations/:id # Organization details
PUT    /v1/organizations/:id  # Update organization
```

---

## 🎯 Transactional Architecture

The project implements an advanced transactional architecture with the following features:

### **Advantages**

- **Atomicity** : All operations execute in a single transaction
- **Portability** : Compatible with TypeORM, Prisma, Sequelize, etc.
- **DDD Compliance** : No framework dependencies in the domain
- **Testability** : Easy to mock and test
- **Flexibility** : Easy migration to other ORMs

### **Unit of Work Pattern**

```typescript
// Usage example
async createUserAndOrganization(data: IUserCreate): Promise<IUser> {
  return await this.unitOfWork.withTransaction(async (uow) => {
    const user = await this.createUserUseCase.execute(data);
    const organization = await this.createOrganizationUseCase.execute({
      name: data.organization,
      ownerId: user.id,
    });
    await this.addUserToOrganizationUseCase.execute({
      userId: user.id,
      organizationId: organization.id,
      role: Role.ADMIN,
    });
    return user;
  });
}
```

For more details, see the [complete documentation](./docs/TRANSACTION_ARCHITECTURE.md).

---

## Contributing

### **Contribution Workflow**

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Code Standards**

- **ESLint** : Strict configuration for code quality
- **Prettier** : Automatic code formatting
- **TypeScript** : Strict typing enabled
- **Tests** : Code coverage required

### **Conventions**

- **Commits** : Conventional commits format
- **Branches** : `feature/`, `bugfix/`, `hotfix/`
- **Code** : Strict TypeScript style guide

---

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.

---

## Support

For any questions or issues:

- **Email** : support@izzzi.com
- **Issues** : [GitHub Issues](https://github.com/your-org/izzzi-backend/issues)
- **Documentation** : [Project Wiki](https://github.com/your-org/izzzi-backend/wiki)

---

## Team

- **Development** : Izzzi Team
- **Architecture** : Domain-Driven Design
- **Technologies** : NestJS, TypeScript, PostgreSQL

---

<div align="center">

**Built with ❤️ by the Izzzi Team**

[![NestJS](https://img.shields.io/badge/NestJS-11.0.1-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-8.16.3-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

</div>
