import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthTables1789560000000 implements MigrationInterface {
  name = 'CreateAuthTables1789560000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "therapists" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(60) NOT NULL,
        "email" varchar(254) NOT NULL,
        "phone" varchar(10) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "experience_years" smallint NOT NULL DEFAULT 0,
        "specialization" varchar(120) NOT NULL DEFAULT '',
        "address" varchar(255) NOT NULL DEFAULT '',
        "is_available" boolean NOT NULL DEFAULT true,
        "avatar_url" varchar(500),
        "time_zone" varchar(64) NOT NULL DEFAULT 'Asia/Kathmandu',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_therapists" PRIMARY KEY ("id"),
        CONSTRAINT "ck_therapists_experience_years" CHECK ("experience_years" BETWEEN 0 AND 50),
        CONSTRAINT "ck_therapists_email_lower" CHECK ("email" = lower("email"))
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_therapists_email" ON "therapists" ("email")`,
    );

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "therapist_id" uuid NOT NULL,
        "token_hash" char(64) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        "replaced_by_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "fk_refresh_tokens_therapist" FOREIGN KEY ("therapist_id")
          REFERENCES "therapists" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_refresh_tokens_therapist_id" ON "refresh_tokens" ("therapist_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "therapists"`);
  }
}
