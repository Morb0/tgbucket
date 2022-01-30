import { Migration } from '@mikro-orm/migrations';

export class Migration20220130091335 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "file_entity" ("id" varchar(255) not null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "mimetype" varchar(255) not null, "size" int4 not null, "dc_id" int4 not null, "file_id" varchar(255) not null, "file_access_hash" varchar(255) not null, "message_id" int4 not null, "filename" varchar(255) null);');
    this.addSql('alter table "file_entity" add constraint "file_entity_pkey" primary key ("id");');
  }

}
