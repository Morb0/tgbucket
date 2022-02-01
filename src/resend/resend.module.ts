import { Module } from '@nestjs/common';

import { FilesModule } from '../files/files.module';
import { TelegramModule } from '../telegram/telegram.module';
import { ResendService } from './resend.service';

@Module({
  imports: [TelegramModule, FilesModule],
  providers: [ResendService],
  exports: [ResendService],
})
export class ResendModule {}
