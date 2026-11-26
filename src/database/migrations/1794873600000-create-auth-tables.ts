import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthTables1794873600000 implements MigrationInterface {
  name = 'CreateAuthTables1794873600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL,
        "name" varchar(150) NOT NULL,
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT "PK_users"
          PRIMARY KEY ("id"),

        CONSTRAINT "UQ_users_email"
          UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "auth_sessions" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "refresh_token_hash" varchar(64) NOT NULL,
        "previous_token_hash" varchar(64),
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT "PK_auth_sessions"
          PRIMARY KEY ("id"),

        CONSTRAINT "FK_auth_sessions_user"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_auth_sessions_user_id"
      ON "auth_sessions" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_auth_sessions_expires_at"
      ON "auth_sessions" ("expires_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "auth_sessions"`);

    await queryRunner.query(`DROP TABLE "users"`);
  }
}
