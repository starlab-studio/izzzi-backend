# Izzzi Backend

[![NestJS](https://img.shields.io/badge/NestJS-11.0.1-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TypeORM](https://img.shields.io/badge/TypeORM-0.3.27-FA5252?style=flat-square&logo=typeorm&logoColor=white)](https://typeorm.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-8.16.3-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

> **Modern Backend API** built with NestJS, TypeScript and DDD (Domain-Driven Design) architecture with advanced transactional management.

## Table of Contents

- [Overview](#overview)
- [Architecture](#️architecture)
- [Modules](#modules)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Available Scripts](#available-scripts)
- [Database](#️database)
- [Testing](#testing)
- [Docker](#docker)
- [Deployment Infrastructure](#deployment-infrastructure)
- [Documentation](#documentation)
- [Contributing](#contributing)

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
│   ├── organization/             # Organization module
│   ├── user/                     # User management
│   ├── class/                    # Class management
│   ├── subject/                  # Subject management
│   ├── quiz/                     # Quiz system
│   ├── subscription/              # Subscription & billing
│   ├── payment/                  # Payment processing (Stripe)
│   ├── notification/             # Notification system
│   ├── feedback/                 # Feedback & reports
│   ├── report/                    # Reporting system
│   ├── faq/                      # FAQ management
│   ├── contact/                  # Contact form
│   ├── storage/                  # File storage (AWS S3)
│   ├── ai/                       # AI integration
│   └── super-admin/              # Super admin features
└── migrations/                   # Database migrations
```

### **Implemented Patterns**

- **Domain-Driven Design (DDD)**
- **Unit of Work Pattern**
- **Repository Pattern**
- **Event-Driven Architecture**
- **CQRS (Command Query Responsibility Segregation)**

---

## Modules

The backend is organized into **15 business modules**, each implementing DDD principles:

### **Core Modules**

| Module           | Description                    | Key Features                                                                                 |
| ---------------- | ------------------------------ | -------------------------------------------------------------------------------------------- |
| **auth**         | Authentication & Authorization | Multi-provider auth (Cognito, Google OAuth2), JWT tokens, refresh tokens, session management |
| **user**         | User Management                | User CRUD, profile management, user preferences                                              |
| **organization** | Organization Management        | Multi-tenant support, membership system, role-based access control                           |

### **Educational Modules**

| Module      | Description        | Key Features                                                     |
| ----------- | ------------------ | ---------------------------------------------------------------- |
| **class**   | Class Management   | Class creation, student enrollment, class scheduling             |
| **subject** | Subject Management | Subject catalog, curriculum management                           |
| **quiz**    | Quiz System        | Quiz creation, question banks, automated grading, quiz analytics |
| **report**  | Reporting System   | Academic reports, performance analytics, export functionality    |

### **Business Modules**

| Module           | Description             | Key Features                                                             |
| ---------------- | ----------------------- | ------------------------------------------------------------------------ |
| **subscription** | Subscription Management | Plan management, pricing tiers, subscription lifecycle, trial management |
| **payment**      | Payment Processing      | Stripe integration, payment methods, invoice management                  |
| **feedback**     | Feedback System         | User feedback collection, feedback analysis, improvement tracking        |

### **Support Modules**

| Module           | Description         | Key Features                                                                |
| ---------------- | ------------------- | --------------------------------------------------------------------------- |
| **notification** | Notification System | Email notifications (Brevo), in-app notifications, notification preferences |
| **faq**          | FAQ Management      | FAQ creation, categorization, search functionality                          |
| **contact**      | Contact System      | Contact form handling, support ticket management                            |

### **Infrastructure Modules**

| Module          | Description    | Key Features                                             |
| --------------- | -------------- | -------------------------------------------------------- |
| **storage**     | File Storage   | AWS S3 integration, file upload/download, presigned URLs |
| **ai**          | AI Integration | OpenAI integration, AI service communication             |
| **super-admin** | Super Admin    | System administration, global settings, user management  |

---

## Features

### **Authentication & Authorization**

- Factory pattern for multi auth provider support
- AWS Cognito integration
- User identity management
- Role and permission system

### **Organization Management**

- Multi-tenant organization system
- Organization creation and management
- Membership system with roles (Admin, Teacher, Student)
- User roles within organizations
- Organization-level settings and preferences

### **Educational Features**

- **Class Management**: Create and manage classes, enroll students, track attendance
- **Subject Management**: Subject catalog, curriculum organization
- **Quiz System**: Create quizzes, question banks, automated grading, analytics
- **Reporting**: Academic reports, performance analytics, data export

### **Subscription & Billing**

- Subscription plan management with pricing tiers
- Stripe payment integration
- Invoice generation and management
- Trial period management
- Subscription lifecycle (active, cancelled, expired)
- Billing portal integration

### **Payment Processing**

- Stripe payment gateway integration
- Multiple payment methods support
- Webhook handling for payment events
- Invoice management
- Payment confirmation and receipts

### **Transactional Management**

- Atomic transactions
- Portable Unit of Work pattern
- Multi-ORM support

### **Event System & SAGA pattern**

- Domain events
- Event handlers
- Queue system with BullMQ
- Saga pattern to compensate on failure

### **File Storage**

- AWS S3 integration for file storage
- Presigned URLs for secure file access
- File upload/download management
- Digital Ocean Spaces support

### **AI Integration**

- OpenAI API integration
- AI service communication
- Embedding generation for vector search
- AI-powered features

### **Notification System**

- Email notifications via Brevo (Sendinblue)
- In-app notifications
- Notification preferences
- Template-based email system

### **Monitoring & Logging**

- Structured JSON logging
- Performance metrics
- Centralized error handling
- Request/response logging
- Health check endpoints

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

Create a `.env` file at the project root. You can copy `.env.example` as a template:

```bash
cp .env.example .env
```

Then fill in the required values. See `.env.example` for all available variables.

**Required variables** :

- Database configuration
- JWT secrets
- Google OAuth2 credentials (if using Google authentication)
- Frontend URL

**Optional variables** :

- AWS Cognito (if using Cognito auth provider)
- Stripe (if using payment features)
- Brevo API key (for email notifications)

For detailed Google OAuth2 configuration, see [Google OAuth Documentation](./docs/GOOGLE_OAUTH.md).

---

## Configuration

### **Database Configuration**

The project uses TypeORM with PostgreSQL. Configuration is located in `src/data-source.ts`.

### **Module Configuration**

Each module is configured in its own module file:

- `src/modules/auth/auth.module.ts` - Authentication & authorization
- `src/modules/user/user.module.ts` - User management
- `src/modules/organization/organization.module.ts` - Organization management
- `src/modules/class/class.module.ts` - Class management
- `src/modules/subject/subject.module.ts` - Subject management
- `src/modules/quiz/quiz.module.ts` - Quiz system
- `src/modules/subscription/subscription.module.ts` - Subscription management
- `src/modules/payment/payment.module.ts` - Payment processing
- `src/modules/notification/notification.module.ts` - Notification system
- `src/modules/feedback/feedback.module.ts` - Feedback system
- `src/modules/report/report.module.ts` - Reporting system
- `src/modules/faq/faq.module.ts` - FAQ management
- `src/modules/contact/contact.module.ts` - Contact system
- `src/modules/storage/core.module.ts` - File storage
- `src/modules/ai/ai.module.ts` - AI integration
- `src/modules/super-admin/super-admin.module.ts` - Super admin features

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

## Deployment Infrastructure

The IZZZI platform is deployed using **Terraform** for infrastructure provisioning and **Ansible** for application deployment on **Digital Ocean**.

For complete infrastructure documentation, architecture diagrams, and deployment details, see the **[Infrastructure as Code repository](../izzzi-iac/README.md)**.

### **Quick Overview**

- **Infrastructure**: Terraform-managed Digital Ocean resources (VPC, Droplets, Firewalls, DNS, Spaces)
- **Orchestration**: Docker Swarm cluster with 1 Manager + 1-2 Worker nodes
- **Services**: Traefik (reverse proxy), Frontend (3 replicas), Backend (2 replicas), AI-API (2 replicas), PostgreSQL, Redis
- **Deployment**: Automated via Ansible playbooks
- **Monitoring**: Traefik dashboard, health checks, service logs

---

## Documentation

### **Technical Documentation**

- [Transactional Architecture](./docs/TRANSACTION_ARCHITECTURE.md) - Complete documentation on transaction management
- [Google OAuth2](./docs/GOOGLE_OAUTH.md) - Complete documentation on Google OAuth2 authentication

### **API Documentation**

Once the application is started, Swagger documentation is available at:

- **Development** : http://localhost:3000/api
- **Production** : https://www.api.smoothbill.fr/api

### **Main Endpoints**

#### **Authentication**

```
POST /v1/auth/signup          # Registration
POST /v1/auth/signin          # Login
POST /v1/auth/refresh-token   # Refresh token
POST /v1/auth/logout          # Logout
GET  /v1/auth/providers       # Get user's auth providers

# Google OAuth2
GET  /v1/auth/google/authorize              # Get Google OAuth URL
GET  /v1/auth/google/callback               # Google OAuth callback
POST /v1/auth/google/complete-registration  # Complete Google signup
```

For Google OAuth2 details, see [Google OAuth Documentation](./docs/GOOGLE_OAUTH.md).

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
DELETE /v1/organizations/:id  # Delete organization
```

#### **Classes**

```
GET    /v1/classes             # List classes
POST   /v1/classes             # Create class
GET    /v1/classes/:id         # Class details
PUT    /v1/classes/:id         # Update class
DELETE /v1/classes/:id         # Delete class
```

#### **Subjects**

```
GET    /v1/subjects            # List subjects
POST   /v1/subjects            # Create subject
GET    /v1/subjects/:id        # Subject details
PUT    /v1/subjects/:id        # Update subject
DELETE /v1/subjects/:id        # Delete subject
```

#### **Quizzes**

```
GET    /v1/quizzes             # List quizzes
POST   /v1/quizzes             # Create quiz
GET    /v1/quizzes/:id         # Quiz details
PUT    /v1/quizzes/:id         # Update quiz
DELETE /v1/quizzes/:id         # Delete quiz
POST   /v1/quizzes/:id/submit  # Submit quiz answers
```

#### **Subscriptions**

```
GET    /v1/subscriptions       # Get user subscriptions
POST   /v1/subscriptions       # Create subscription
GET    /v1/subscriptions/plans # Get pricing plans
PUT    /v1/subscriptions/:id   # Update subscription
DELETE /v1/subscriptions/:id   # Cancel subscription
```

#### **Payments**

```
POST   /v1/payments/checkout   # Create checkout session
GET    /v1/payments/invoices   # List invoices
GET    /v1/payments/portal      # Get billing portal link
POST   /v1/webhooks/stripe     # Stripe webhook handler
```

#### **Notifications**

```
GET    /v1/notifications        # List notifications
POST   /v1/notifications        # Create notification
PUT    /v1/notifications/:id/read # Mark as read
```

#### **Feedback**

```
GET    /v1/feedback            # List feedback
POST   /v1/feedback             # Submit feedback
GET    /v1/feedback/:id        # Feedback details
```

#### **Storage**

```
POST   /v1/storage/upload      # Upload file
GET    /v1/storage/:id         # Get file
DELETE /v1/storage/:id         # Delete file
```

For complete API documentation, visit the Swagger UI at `/api` when the application is running.

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

- **Development** : developed and maintained by [Omer DOTCHAMOU](https://www.omerdotchamou.com), [Saidou IBRAHIM](https://github.com/isaidou), [Johnny CHEN](https://github.com/johnnyhelloworld) and [Faez BACAR ZOUBEIRI](https://github.com/FAEZ10).
- **Architecture** : Domain-Driven Design
- **Technologies** : NestJS, TypeScript, PostgreSQL, AWS

---

<div align="center">

**Built with ❤️ by the Izzzi Team**

[![NestJS](https://img.shields.io/badge/NestJS-11.0.1-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-8.16.3-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

</div>
