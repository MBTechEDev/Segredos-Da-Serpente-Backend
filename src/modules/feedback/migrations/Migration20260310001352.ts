import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260310001352 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "feedback" ("id" text not null, "transport_rating" integer null, "transport_comment" text null, "service_rating" integer null, "service_comment" text null, "product_rating" integer null, "product_comment" text null, "is_published" boolean not null default false, "status" text check ("status" in ('draft', 'partial', 'completed')) not null default 'draft', "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "feedback_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_feedback_deleted_at" ON "feedback" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "feedback_image" ("id" text not null, "url" text not null, "file_id" text not null, "feedback_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "feedback_image_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_feedback_image_feedback_id" ON "feedback_image" ("feedback_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_feedback_image_deleted_at" ON "feedback_image" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "feedback_image" add constraint "feedback_image_feedback_id_foreign" foreign key ("feedback_id") references "feedback" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "feedback_image" drop constraint if exists "feedback_image_feedback_id_foreign";`);

    this.addSql(`drop table if exists "feedback" cascade;`);

    this.addSql(`drop table if exists "feedback_image" cascade;`);
  }

}
