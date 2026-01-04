import { MigrationInterface, QueryRunner } from "typeorm";
import * as argon2 from "argon2";

export class SeedSuperAdmin1767473000000 implements MigrationInterface {
  name = "SeedSuperAdmin1767473000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const email = "superadmin@izzzi.io";
    const password = "SuperAdmin123!@#";
    const firstName = "Super";
    const lastName = "Admin";
    
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
      hashLength: 32,
    });

    const userId = "00000000-0000-0000-0000-000000000001";
    const authIdentityId = "00000000-0000-0000-0000-000000000002";
    const providerUserId = `custom:${Date.now()}:${email}`;
    const now = new Date();

    await queryRunner.query(`
      INSERT INTO "users" (
        "id", "first_name", "last_name", "email", 
        "phone_number", "avatar_url", "last_login", 
        "status", "role", "created_at", "updated_at"
      ) VALUES (
        '${userId}',
        '${firstName}',
        '${lastName}',
        '${email}',
        NULL,
        NULL,
        NULL,
        'active',
        'SUPER_ADMIN',
        '${now.toISOString()}',
        '${now.toISOString()}'
      )
      ON CONFLICT (id) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "auth_identities" (
        "id", "provider", "provider_user_id", "username", 
        "password", "user_id", "failed_login_attempts", 
        "last_failed_login_at", "locked_until", "is_locked", 
        "is_email_verified", "email_verified_at", 
        "created_at", "updated_at"
      ) VALUES (
        '${authIdentityId}',
        'CUSTOM',
        '${providerUserId}',
        '${email}',
        '${hashedPassword}',
        '${userId}',
        0,
        NULL,
        NULL,
        false,
        true,
        '${now.toISOString()}',
        '${now.toISOString()}',
        '${now.toISOString()}'
      )
      ON CONFLICT (id) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const userId = "00000000-0000-0000-0000-000000000001";
    const authIdentityId = "00000000-0000-0000-0000-000000000002";

    await queryRunner.query(`
      DELETE FROM "auth_identities" 
      WHERE "id" = '${authIdentityId}'
    `);

    await queryRunner.query(`
      DELETE FROM "users" 
      WHERE "id" = '${userId}'
    `);
  }
}

