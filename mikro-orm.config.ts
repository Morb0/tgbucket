import { MikroORMOptions } from '@mikro-orm/core';

export default {
  type: 'postgresql',
  clientUrl: process.env.DATABASE_URL,
  entitiesTs: ['./**/*.entity.ts'],
  discovery: {
    warnWhenNoEntities: false,
  },
} as MikroORMOptions;
