import { Module } from '@nestjs/common';

import { MtprotoProvider } from './mtporoto.provider';
import { TelegramService } from './telegram.service';

@Module({
  providers: [TelegramService, MtprotoProvider],
  exports: [TelegramService],
})
export class TelegramModule {}
