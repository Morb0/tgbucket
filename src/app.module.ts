import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { databaseConfig } from './configs/database.config';
import { mtprotoConfig } from './configs/mtproto.config';
import { FilesController } from './files.controller';
import { FilesModule } from './files/files.module';
import { TelegramModule } from './telegram/telegram.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, mtprotoConfig],
    }),
    MikroOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('database')!,
      inject: [ConfigService],
    }),
    FilesModule,
    UploadModule,
    TelegramModule,
  ],
  controllers: [FilesController],
})
export class AppModule {}
