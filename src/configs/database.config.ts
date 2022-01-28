import { IDatabaseDriver } from '@mikro-orm/core/drivers/IDatabaseDriver';
import { MikroOrmModuleOptions } from '@mikro-orm/nestjs/typings';
import { PostgreSqlConnection } from '@mikro-orm/postgresql';
import { Logger } from '@nestjs/common';
import { registerAs } from '@nestjs/config';

const dbLogger = new Logger('Database');
export const databaseConfig = registerAs(
  'database',
  (): MikroOrmModuleOptions<IDatabaseDriver<PostgreSqlConnection>> => ({
    type: 'postgresql',
    clientUrl: process.env.DATABASE_URL,
    autoLoadEntities: true,
    discovery: {
      warnWhenNoEntities: false,
    },
    debug: process.env.NODE_ENV !== 'production',
    logger: (msg) => dbLogger.log(msg),
  }),
);
