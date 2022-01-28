import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { databaseConfig } from './configs/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    MikroOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('database')!,
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
