import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FileEntity } from '../files/file.entity';
import { FilesService } from '../files/files.service';
import { TelegramService } from '../telegram/telegram.service';
import { UploadFile } from './models/upload-file.model';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
  ) {}

  async processFile(file: UploadFile): Promise<FileEntity> {
    this.logger.log(`Uploading file to Telegram (${file.mimetype})`);
    const inputFile = await this.telegramService.uploadFile(
      file.data,
      file.size,
    );

    this.logger.debug('Send media message to Telegram');
    const chatId = this.configService.get('TELEGRAM_CHAT_ID');
    const newMessageUpdate =
      await this.telegramService.uploadAndSendDocumentToChat(
        chatId,
        inputFile,
        file.filename,
      );

    this.logger.debug('Save file info to database');
    const message = newMessageUpdate.message;
    const document = message.media.document;
    const fileEntity = new FileEntity(
      file.mimetype,
      document.size,
      document.dc_id,
      document.id,
      document.access_hash,
      message.id,
      file.filename,
    );
    await this.filesService.create(fileEntity);
    this.logger.log(`File "${fileEntity.id}" successfully uploaded`);
    return fileEntity;
  }
}
