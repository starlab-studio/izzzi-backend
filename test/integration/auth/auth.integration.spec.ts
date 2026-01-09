import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { TypeOrmModule, getDataSourceToken } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { AuthModule } from "src/modules/auth/auth.module";
import { OrganizationModule } from "src/modules/organization/organization.module";
import { CoreModule } from "src/core/core.module";
import { AuthFacade } from "src/modules/auth/application/facades/auth.facade";
import { CustomAuthAdapter } from "src/modules/auth/infrastructure/factories/custom.adapter";
import { IAuthIdentityRepository } from "src/modules/auth/domain/repositories/authIdentity.repository";
import { IVerificationTokenRepository } from "src/modules/auth/domain/repositories/verificationToken.repository";
import { IRefreshTokenRepository } from "src/modules/auth/domain/repositories/refreshToken.repository";
import { IPasswordResetTokenRepository } from "src/modules/auth/domain/repositories/passwordResetToken.repository";
import { IUserRepository } from "src/modules/organization/domain/repositories/user.repository";
import { IOrganizationRepository } from "src/modules/organization/domain/repositories/organization.repository";
import { SignUpData, SignInData } from "src/modules/auth/domain/types";
import { EmailProvider } from "src/modules/notification/infrastructure/providers/email.provider";
import { STRIPE_SYNC_SERVICE } from "src/modules/payment/domain/services/stripe-sync.service";
import { StripeSyncService } from "src/modules/payment/infrastructure/services/stripe-sync.service";
import { CognitoAdapter } from "src/modules/auth/infrastructure/factories/cognito.adapter";
import { VerificationTokenRepository } from "src/modules/auth/infrastructure/repositories/verificationToken.repository";
import { PasswordResetTokenRepository } from "src/modules/auth/infrastructure/repositories/passwordResetToken.repository";
import { TypeOrmUnitOfWork, ErrorCode, DomainError } from "src/core";
import { AuthIdentityName } from "src/modules/auth/domain/types";
import { createMockEmailProvider, createMockStripeSyncService, createMockCognitoAdapter } from "../test-helpers";
import { waitForDatabase } from "../db-helper";

describe("Auth Integration", () => {
  let app: INestApplication;
  let authFacade: AuthFacade;
  let authAdapter: CustomAuthAdapter;
  let userRepository: IUserRepository;
  let authIdentityRepository: IAuthIdentityRepository;
  let verificationTokenRepository: IVerificationTokenRepository;
  let passwordResetTokenRepository: IPasswordResetTokenRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ 
          isGlobal: true,
          load: [() => ({
            auth: {
              jwt: {
                secret: process.env.AUTH_JWT_SECRET || "test-jwt-secret-key-for-integration-tests",
                expiresIn: process.env.AUTH_JWT_EXPIRES_IN || "24h",
              },
            },
          })],
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
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
        AuthModule,
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

    authFacade = moduleFixture.get<AuthFacade>(AuthFacade);
    authAdapter = moduleFixture.get<CustomAuthAdapter>(CustomAuthAdapter);
    userRepository = moduleFixture.get<IUserRepository>("USER_REPOSITORY");
    authIdentityRepository = moduleFixture.get<IAuthIdentityRepository>("AUTH_IDENTITY_REPOSITORY");
    verificationTokenRepository = moduleFixture.get<IVerificationTokenRepository>(VerificationTokenRepository);
    passwordResetTokenRepository = moduleFixture.get<IPasswordResetTokenRepository>(PasswordResetTokenRepository);
  });

  afterAll(async () => {
    const dataSource = app.get(DataSource);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  it("should complete signup flow with email verification", async () => {
    const signUpData: SignUpData = {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@test.com",
      password: "SecurePass572!@#",
      organization: "Test Org",
    };

    const signUpResponse = await authAdapter.signUp(signUpData);

    expect(signUpResponse.email).toBe(signUpData.email);
    expect(signUpResponse.verificationToken).toBeDefined();
    expect(signUpResponse.sendVerificationToken).toBe(true);
    expect(signUpResponse.authIdentityId).toBeDefined();

    const verificationToken = await verificationTokenRepository.findByToken(signUpResponse.verificationToken);
    expect(verificationToken).toBeDefined();
    expect(verificationToken?.email).toBe(signUpData.email);

    const user = await userRepository.findByEmail(signUpData.email);
    expect(user).toBeDefined();
    if (user) {
      expect(user.email).toBe(signUpData.email);
      expect(user.firstName).toBe(signUpData.firstName);
      expect(user.lastName).toBe(signUpData.lastName);
    }

    const authIdentity = await authIdentityRepository.findByProviderAndUsername(
      AuthIdentityName.CUSTOM,
      signUpData.email
    );
    expect(authIdentity).toBeDefined();
    expect(authIdentity?.isEmailVerified).toBe(false);
    if (authIdentity && user) {
      expect(authIdentity.userId).toBe(user.id);
    }

  });

  it("should complete signin flow and generate tokens", async () => {
    const signUpData: SignUpData = {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@test.com",
      password: "SecurePass572!@#",
      organization: "Test Org 2",
    };

    const signUpResponse = await authFacade.signUp(signUpData);
    
    await authAdapter.confirmSignUp({
      token: signUpResponse.verificationToken,
    });

    const authIdentityBefore = await authIdentityRepository.findByProviderAndUsername(
      AuthIdentityName.CUSTOM,
      signUpData.email
    );
    expect(authIdentityBefore?.isEmailVerified).toBe(true);

    const signInData: SignInData = {
      email: signUpData.email,
      password: signUpData.password,
    };

    const signInResponse = await authAdapter.signIn(signInData);

    expect(signInResponse.accessToken).toBeDefined();
    expect(signInResponse.refreshToken).toBeDefined();
    expect(typeof signInResponse.accessToken).toBe("string");
    expect(typeof signInResponse.refreshToken).toBe("string");
    expect(signInResponse.accessToken.length).toBeGreaterThan(0);
    expect(signInResponse.refreshToken.length).toBeGreaterThan(0);
  });

  it("should complete password reset flow", async () => {
    const signUpData: SignUpData = {
      firstName: "Reset",
      lastName: "User",
      email: "reset.user@test.com",
      password: "OldSecure572!@#",
      organization: "Test Org 3",
    };

    const signUpResponse = await authFacade.signUp(signUpData);
    
    await authAdapter.confirmSignUp({
      token: signUpResponse.verificationToken,
    });

    await authAdapter.forgotPassword({ email: signUpData.email });

    const resetToken = await passwordResetTokenRepository.findByEmailAndNotUsed(signUpData.email);
    expect(resetToken).toBeDefined();
    expect(resetToken?.email).toBe(signUpData.email);
    if (resetToken) {
      expect(resetToken.email).toBe(signUpData.email);
      expect(resetToken.expiresAt).toBeDefined();
      expect(new Date(resetToken.expiresAt) > new Date()).toBe(true);
    }
  });

  it("should reject signup with existing email", async () => {
    const signUpData: SignUpData = {
      firstName: "Duplicate",
      lastName: "User",
      email: "duplicate@test.com",
      password: "SecurePass572!@#",
      organization: "Duplicate Org",
    };

    await authFacade.signUp(signUpData);

    try {
      await authFacade.signUp(signUpData);
      fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).errors[0]?.code).toBe(ErrorCode.EMAIL_ALREADY_EXISTS);
    }
  });

  it("should reject signin with invalid credentials", async () => {
    const signUpData: SignUpData = {
      firstName: "Invalid",
      lastName: "User",
      email: "invalid@test.com",
      password: "SecurePass572!@#",
      organization: "Invalid Org",
    };

    const signUpResponse = await authFacade.signUp(signUpData);
    await authAdapter.confirmSignUp({
      token: signUpResponse.verificationToken,
    });

    await expect(authAdapter.signIn({
      email: signUpData.email,
      password: "WrongPassword123!@#",
    })).rejects.toThrow(DomainError);
  });

  it("should reject signin with unverified email", async () => {
    const signUpData: SignUpData = {
      firstName: "Unverified",
      lastName: "User",
      email: "unverified@test.com",
      password: "SecurePass572!@#",
      organization: "Unverified Org",
    };

    await authFacade.signUp(signUpData);

    await expect(authAdapter.signIn({
      email: signUpData.email,
      password: signUpData.password,
    })).rejects.toThrow(DomainError);
    await expect(authAdapter.signIn({
      email: signUpData.email,
      password: signUpData.password,
    })).rejects.toThrow(DomainError);
  });

  it("should reject signin with non-existent email", async () => {
    await expect(authAdapter.signIn({
      email: "nonexistent@test.com",
      password: "SecurePass572!@#",
    })).rejects.toThrow(DomainError);
    await expect(authAdapter.signIn({
      email: "nonexistent@test.com",
      password: "SecurePass572!@#",
    })).rejects.toThrow(DomainError);
  });

  it("should reject confirmSignUp with invalid token", async () => {
    await expect(authAdapter.confirmSignUp({
      token: "invalid-token-12345",
    })).rejects.toThrow(DomainError);
  });

  it("should handle forgotPassword with non-existent email", async () => {
    await authAdapter.forgotPassword({
      email: "nonexistent@test.com",
    });
    const resetToken = await passwordResetTokenRepository.findByEmailAndNotUsed("nonexistent@test.com");
    expect(resetToken).toBeNull();
  });
});

