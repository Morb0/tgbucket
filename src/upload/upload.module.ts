import { Module } from '@nestjs/common';

import { FilesModule } from '../files/files.module';
import { TelegramModule } from '../telegram/telegram.module';
import { UploadService } from './upload.service';

@Module({
  imports: [TelegramModule, FilesModule],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
