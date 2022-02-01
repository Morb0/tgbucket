import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';

import { AppController } from './app.controller';
import { GlobalExceptionFilter } from './common/global.filter';
import { databaseConfig } from './configs/database.config';
import { mtprotoConfig } from './configs/mtproto.config';
import { DownloadModule } from './download/download.module';
import { FilesModule } from './files/files.module';
import { ResendModule } from './resend/resend.module';
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
    DownloadModule,
    ResendModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
