import { MikroORMOptions } from '@mikro-orm/core';

export default {
  type: 'postgresql',
  clientUrl: process.env.DATABASE_URL,
  entitiesTs: ['./src/**/*.entity.ts'],
  migrations: {
    pathTs: './migrations',
    emit: 'ts',
  },
  discovery: {
    warnWhenNoEntities: false,
  },
} as MikroORMOptions;
