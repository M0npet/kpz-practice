import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTasks1792070111756 implements MigrationInterface {
  name = 'CreateTasks1792070111756';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "tasks" (
                "id" SERIAL NOT NULL,
                "title" character varying(120) NOT NULL,
                "description" text,
                "status" character varying(20) NOT NULL DEFAULT 'TODO',
                "priority" character varying(10) NOT NULL DEFAULT 'MEDIUM',
                "due_date" date,
                "completed_at" TIMESTAMP WITH TIME ZONE,
                "owner_id" integer NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0631c1eb8316f8af361cf14eb8" ON "tasks" ("owner_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "tasks"
            ADD CONSTRAINT "FK_0631c1eb8316f8af361cf14eb85" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "tasks" DROP CONSTRAINT "FK_0631c1eb8316f8af361cf14eb85"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_0631c1eb8316f8af361cf14eb8"
        `);
    await queryRunner.query(`
            DROP TABLE "tasks"
        `);
  }
}
