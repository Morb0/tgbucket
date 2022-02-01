import { Injectable, Logger } from '@nestjs/common';

import { FilesService } from '../files/files.service';
import { TelegramService } from '../telegram/telegram.service';
import { FileNotExistException } from './exceptions/file-not-exist.exception';
import { UserNotFoundException } from './exceptions/user-not-found.exception';

@Injectable()
export class ResendService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly filesService: FilesService,
    private readonly telegramService: TelegramService,
  ) {}

  async resendFile(fileId: string, username: string): Promise<void> {
    this.logger.log(`Resend file "${fileId}" to ${username}`);

    this.logger.debug('Get file info from db...');
    const file = await this.filesService.findFile(fileId);
    if (!file) {
      this.logger.error(`File "${fileId}" not exist`);
      throw new FileNotExistException(fileId);
    }

    this.logger.debug('Resolve user by username...');
    const user = await this.telegramService.resolveUserIdByUsername(username);
    if (!user) {
      this.logger.error(`Failed to find "${username}" user`);
      throw new UserNotFoundException(username);
    }

    this.logger.debug('Get file reference...');
    const fileReference = await this.telegramService.getMessageFileReference(
      file.messageId,
    );

    this.logger.debug('Send file to user...');
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
