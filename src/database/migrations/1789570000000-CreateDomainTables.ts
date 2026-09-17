import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDomainTables1789570000000 implements MigrationInterface {
  name = 'CreateDomainTables1789570000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "patients" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(60) NOT NULL,
        "age" smallint NOT NULL,
        "gender" varchar(10) NOT NULL,
        "phone" varchar(15) NOT NULL,
        "address" varchar(255) NOT NULL,
        "condition" varchar(120) NOT NULL,
        "treatment_plan" text NOT NULL DEFAULT '',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_patients" PRIMARY KEY ("id"),
        CONSTRAINT "ck_patients_gender" CHECK ("gender" IN ('Female', 'Male', 'Other')),
        CONSTRAINT "ck_patients_age" CHECK ("age" BETWEEN 0 AND 130)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_patients_name" ON "patients" ("name", "id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "slots" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "therapist_id" uuid NOT NULL,
        "start_at" timestamptz NOT NULL,
        "duration_minutes" smallint NOT NULL DEFAULT 60,
        "is_blocked" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_slots" PRIMARY KEY ("id"),
        CONSTRAINT "fk_slots_therapist" FOREIGN KEY ("therapist_id")
          REFERENCES "therapists" ("id") ON DELETE CASCADE,
        CONSTRAINT "ck_slots_duration" CHECK ("duration_minutes" BETWEEN 15 AND 240)
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_slots_therapist_start" ON "slots" ("therapist_id", "start_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "therapist_id" uuid NOT NULL,
        "patient_id" uuid NOT NULL,
        "start_at" timestamptz NOT NULL,
        "duration_minutes" smallint NOT NULL DEFAULT 60,
        "treatment" varchar(120) NOT NULL,
        "visit_type" varchar(10) NOT NULL,
        "location" varchar(255) NOT NULL,
        "status" varchar(12) NOT NULL DEFAULT 'request',
        "remarks" text,
        "decline_reason" varchar(500),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "fk_sessions_therapist" FOREIGN KEY ("therapist_id")
          REFERENCES "therapists" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_sessions_patient" FOREIGN KEY ("patient_id")
          REFERENCES "patients" ("id") ON DELETE RESTRICT,
        CONSTRAINT "ck_sessions_status" CHECK ("status" IN ('request', 'upcoming', 'completed', 'cancelled')),
        CONSTRAINT "ck_sessions_visit_type" CHECK ("visit_type" IN ('home', 'clinic')),
        CONSTRAINT "ck_sessions_completed_remarks" CHECK ("status" <> 'completed' OR "remarks" IS NOT NULL)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_sessions_therapist_status_start" ON "sessions" ("therapist_id", "status", "start_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_sessions_patient_id" ON "sessions" ("patient_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_sessions_booked_start" ON "sessions" ("therapist_id", "start_at")
       WHERE status IN ('upcoming', 'completed')`,
    );

    await queryRunner.query(`
      CREATE TABLE "notes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "therapist_id" uuid NOT NULL,
        "patient_id" uuid NOT NULL,
        "title" varchar(80) NOT NULL,
        "body" varchar(2000) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz,
        "session_id" uuid,
        CONSTRAINT "pk_notes" PRIMARY KEY ("id"),
        CONSTRAINT "fk_notes_therapist" FOREIGN KEY ("therapist_id")
          REFERENCES "therapists" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_notes_patient" FOREIGN KEY ("patient_id")
          REFERENCES "patients" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_notes_session" FOREIGN KEY ("session_id")
          REFERENCES "sessions" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_notes_patient_created" ON "notes" ("patient_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_notes_session_id" ON "notes" ("session_id")`,
    );

    await queryRunner.query(`CREATE SEQUENCE "complaint_reference_seq"`);
    await queryRunner.query(`
      CREATE TABLE "complaints" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "therapist_id" uuid NOT NULL,
        "reference" varchar(20) NOT NULL
          DEFAULT ('PG-C-' || lpad(nextval('complaint_reference_seq')::text, 4, '0')),
        "category" varchar(20) NOT NULL,
        "subject" varchar(80) NOT NULL,
        "description" varchar(1000) NOT NULL,
        "status" varchar(12) NOT NULL DEFAULT 'submitted',
        "submitted_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_complaints" PRIMARY KEY ("id"),
        CONSTRAINT "fk_complaints_therapist" FOREIGN KEY ("therapist_id")
          REFERENCES "therapists" ("id") ON DELETE CASCADE,
        CONSTRAINT "ck_complaints_category" CHECK ("category" IN ('patient', 'booking', 'payment', 'technical', 'other')),
        CONSTRAINT "ck_complaints_status" CHECK ("status" IN ('submitted', 'in_review', 'resolved'))
      )
    `);
    await queryRunner.query(
      `ALTER SEQUENCE "complaint_reference_seq" OWNED BY "complaints"."reference"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_complaints_reference" ON "complaints" ("reference")`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_complaints_therapist_submitted" ON "complaints" ("therapist_id", "submitted_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "complaints"`);
    await queryRunner.query(`DROP TABLE "notes"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TABLE "slots"`);
    await queryRunner.query(`DROP TABLE "patients"`);
  }
}
