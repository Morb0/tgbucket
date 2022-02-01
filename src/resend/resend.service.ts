import { Injectable, Logger } from '@nestjs/common';

import { FilesService } from '../files/files.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class ResendService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly filesService: FilesService,
    private readonly telegramService: TelegramService,
  ) {}

  async resendFile(fileId: string, username: string): Promise<void> {
    this.logger.log(`Resend file "${fileId}" to ${username}`);

    this.logger.debug('Get file info from db');
    const file = await this.filesService.findFileOrThrow(fileId);

    this.logger.debug('Resolve user by username');
    const user = await this.telegramService.resolveUserIdByUsernameOrThrow(
      username,
    );

    this.logger.debug('Get file reference');
    const fileReference = await this.telegramService.getMessageFileReference(
      file.messageId,
    );

    this.logger.debug('Send file to user');
    await this.telegramService.sendDocumentToUser(
      user.id,
      user.access_hash,
      file.fileId,
      file.fileAccessHash,
      fileReference,
    );

    this.logger.log(`Successfully resend "${fileId}" to "${username}" user`);
  }
}
