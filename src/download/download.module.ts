import { Module } from '@nestjs/common';

import { FilesModule } from '../files/files.module';
import { TelegramModule } from '../telegram/telegram.module';
import { DownloadService } from './download.service';

@Module({
  imports: [FilesModule, TelegramModule],
  providers: [DownloadService],
  exports: [DownloadService],
})
export class DownloadModule {}
