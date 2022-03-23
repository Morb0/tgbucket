import { MikroORM } from '@mikro-orm/core';
import { INestApplication, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await migrateDb(app);
  await app.listen(3000);
}

async function migrateDb(app: INestApplication): Promise<void> {
  const logger = new Logger('DBMigration');
  const orm = app.get(MikroORM);
  logger.log('Start database migration');
  await orm.getMigrator().up();
}

bootstrap();
