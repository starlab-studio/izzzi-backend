import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { TypeOrmModule, getDataSourceToken } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { OrganizationModule } from "src/modules/organization/organization.module";
import { CoreModule } from "src/core/core.module";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { IUserRepository } from "src/modules/organization/domain/repositories/user.repository";
import { IOrganizationRepository } from "src/modules/organization/domain/repositories/organization.repository";
import { IMembershipRepository } from "src/modules/organization/domain/repositories/membership.repository";
import { IInvitationRepository } from "src/modules/organization/domain/repositories/invitation.repository";
import { UserEntity } from "src/modules/organization/domain/entities/user.entity";
import { OrganizationEntity } from "src/modules/organization/domain/entities/organization.entity";
import { MembershipEntity } from "src/modules/organization/domain/entities/membership.entity";
import { InvitationEntity } from "src/modules/organization/domain/entities/invitation.entity";
import { UserRole, TypeOrmUnitOfWork, ErrorCode, DomainError } from "src/core";
import { EmailProvider } from "src/modules/notification/infrastructure/providers/email.provider";
import { STRIPE_SYNC_SERVICE } from "src/modules/payment/domain/services/stripe-sync.service";
import { StripeSyncService } from "src/modules/payment/infrastructure/services/stripe-sync.service";
import { CognitoAdapter } from "src/modules/auth/infrastructure/factories/cognito.adapter";
import { OrganizationRepository } from "src/modules/organization/infrastructure/repositories/organization.repository";
import { InvitationRepository } from "src/modules/organization/infrastructure/repositories/invitation.repository";
import { createMockEmailProvider, createMockStripeSyncService, createMockCognitoAdapter } from "../test-helpers";
import { waitForDatabase } from "../db-helper";

describe("Organization Integration", () => {
  let app: INestApplication;
  let organizationFacade: OrganizationFacade;
  let userRepository: IUserRepository;
  let organizationRepository: IOrganizationRepository;
  let membershipRepository: IMembershipRepository;
  let invitationRepository: IInvitationRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: () => ({
            type: "postgres",
            host: process.env.DATABASE_HOST || "localhost",
            port: parseInt(process.env.DATABASE_PORT || "5432"),
            database: process.env.DATABASE_NAME || "test_db",
            username: process.env.DATABASE_USERNAME || "postgres",
            password: process.env.DATABASE_PASSWORD || "postgres",
            synchronize: true,
            autoLoadEntities: true,
            dropSchema: true,
            extra: {
              max: 10,
              connectionTimeoutMillis: 10000,
              idleTimeoutMillis: 30000,
            },
            retryAttempts: 5,
            retryDelay: 3000,
          }),
        }),
        CoreModule,
        OrganizationModule,
      ],
    })
      .overrideProvider(EmailProvider)
      .useValue(createMockEmailProvider())
      .overrideProvider(StripeSyncService)
      .useValue(createMockStripeSyncService())
      .overrideProvider(STRIPE_SYNC_SERVICE)
      .useValue(createMockStripeSyncService())
      .overrideProvider(CognitoAdapter)
      .useValue(createMockCognitoAdapter())
      .overrideProvider(TypeOrmUnitOfWork)
      .useFactory({
        factory: (dataSource: DataSource) => new TypeOrmUnitOfWork(dataSource),
        inject: [getDataSourceToken()],
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const dataSource = app.get(DataSource);
    await waitForDatabase(dataSource);

    organizationFacade = moduleFixture.get<OrganizationFacade>(OrganizationFacade);
    userRepository = moduleFixture.get<IUserRepository>("USER_REPOSITORY");
    organizationRepository = moduleFixture.get<IOrganizationRepository>(OrganizationRepository);
    membershipRepository = moduleFixture.get<IMembershipRepository>("MEMBERSHIP_REPOSITORY");
    invitationRepository = moduleFixture.get<IInvitationRepository>(InvitationRepository);
  });

  afterAll(async () => {
    const dataSource = app.get(DataSource);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  it("should create organization and user with membership", async () => {
    const userData = {
      firstName: "Owner",
      lastName: "User",
      email: "owner@test.com",
      authIdentityId: "auth-123",
      organization: "Owner Org",
    };

    const result = await organizationFacade.createUserAndOrganization(userData);

    expect(result.email).toBe(userData.email);
    expect(result.firstName).toBe(userData.firstName);
    expect(result.lastName).toBe(userData.lastName);
    expect(result.id).toBeDefined();

    const userProfile = await organizationFacade.getUserProfile(result.id);
    expect(userProfile.memberships.length).toBeGreaterThan(0);
    expect(userProfile.memberships[0].role).toBe(UserRole.ADMIN);

    const org = await organizationRepository.findByName(userData.organization);
    expect(org).toBeDefined();
    expect(org?.ownerId).toBe(result.id);
    expect(org?.name).toBe(userData.organization);

    const memberships = await membershipRepository.findByOrganization(org!.id);
    expect(memberships.length).toBe(1);
    expect(memberships[0].userId).toBe(result.id);
    expect(memberships[0].role).toBe(UserRole.ADMIN);
  });

  it("should send invitation and create membership on acceptance", async () => {
    const ownerData = {
      firstName: "Inviter",
      lastName: "User",
      email: "inviter@test.com",
      authIdentityId: "auth-inviter-123",
      organization: "Inviter Org",
    };
    const savedOwner = await organizationFacade.createUserAndOrganization(ownerData);
    
    // Get the organization created for this user
    const orgs = await organizationRepository.findAll();
    const savedOrg = orgs.find(org => org.ownerId === savedOwner.id);
    if (!savedOrg) {
      throw new Error("Organization not found");
    }

    const invitation = await organizationFacade.sendUserInvitation({
      email: "invited@test.com",
      organizationId: savedOrg.id,
      role: UserRole.ADMIN,
      invitedBy: savedOwner.id,
    });

    expect(invitation.email).toBe("invited@test.com");

    const newUserData = {
      firstName: "Invited",
      lastName: "User",
      email: "invited@test.com",
      authIdentityId: "auth-invited-123",
    };
    const savedNewUser = await organizationFacade.createUser(newUserData);

    await organizationFacade.acceptInvitation({
      token: invitation.token,
      userId: savedNewUser.id,
    });

    const memberships = await membershipRepository.findByOrganization(savedOrg.id);
    expect(memberships.some(m => m.userId === savedNewUser.id)).toBe(true);
    
    const newUserMembership = memberships.find(m => m.userId === savedNewUser.id);
    expect(newUserMembership).toBeDefined();
    expect(newUserMembership?.role).toBe(UserRole.ADMIN);
    expect(newUserMembership?.organizationId).toBe(savedOrg.id);
  });

  it("should reject creating organization with duplicate name", async () => {
    const userData1 = {
      firstName: "Owner1",
      lastName: "User1",
      email: "owner1@test.com",
      authIdentityId: "auth-dup-1",
      organization: "Duplicate Org Name",
    };

    const userData2 = {
      firstName: "Owner2",
      lastName: "User2",
      email: "owner2@test.com",
      authIdentityId: "auth-dup-2",
      organization: "Duplicate Org Name",
    };

    await organizationFacade.createUserAndOrganization(userData1);

    try {
      await organizationFacade.createUserAndOrganization(userData2);
      fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).errors[0]?.code).toBe(ErrorCode.ORGANIZATION_ALREADY_EXIST);
    }
  });

  it("should reject creating user with duplicate email", async () => {
    const userData = {
      firstName: "Duplicate",
      lastName: "Email",
      email: "duplicate.email@test.com",
      authIdentityId: "auth-dup-email-1",
      organization: "Duplicate Email Org",
    };

    await organizationFacade.createUserAndOrganization(userData);

    try {
      await organizationFacade.createUser({
        firstName: "Another",
        lastName: "User",
        email: "duplicate.email@test.com",
        authIdentityId: "auth-dup-email-2",
      });
      fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).errors[0]?.code).toBe(ErrorCode.USER_ALREADY_EXISTS);
    }
  });

  it("should reject sending invitation with invalid role", async () => {
    const ownerData = {
      firstName: "Role",
      lastName: "Tester",
      email: "role.tester@test.com",
      authIdentityId: "auth-role-123",
      organization: "Role Test Org",
    };

    const savedOwner = await organizationFacade.createUserAndOrganization(ownerData);
    const orgs = await organizationRepository.findAll();
    const savedOrg = orgs.find(org => org.ownerId === savedOwner.id);
    
    if (!savedOrg) {
      throw new Error("Organization not found");
    }

    try {
      await organizationFacade.sendUserInvitation({
        email: "test@test.com",
        organizationId: savedOrg.id,
        role: UserRole.MEMBER,
        invitedBy: savedOwner.id,
      });
      fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).errors[0]?.code).toBe(ErrorCode.INVALID_INVITED_ROLE);
    }
  });

  it("should reject accepting invitation with invalid token", async () => {
    const userData = {
      firstName: "Token",
      lastName: "Tester",
      email: "token.tester@test.com",
      authIdentityId: "auth-token-123",
    };

    const savedUser = await organizationFacade.createUser(userData);

    try {
      await organizationFacade.acceptInvitation({
        token: "invalid-token-12345",
        userId: savedUser.id,
      });
      fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).errors[0]?.code).toBe(ErrorCode.INVALID_OR_EXPIRED_INVITATION);
    }
  });
});

