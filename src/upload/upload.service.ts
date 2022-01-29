import { Injectable, Logger } from '@nestjs/common';

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
  ) {}

  async processFile(uploadFile: UploadFile): Promise<FileEntity> {
    this.logger.debug('Upload file to Telegram');
    const inputFile = await this.telegramService.uploadFile(
      uploadFile.data,
      uploadFile.size,
    );

    this.logger.debug('Send media message to Telegram');
    const newMessageUpdate = await this.telegramService.sendMediaToSelf(
      inputFile,
    );

    this.logger.debug('Save file info to database');
    const message = newMessageUpdate.message;
    const document = message.media.document;
    const file = new FileEntity(
      uploadFile.mimetype,
      document.size,
      document.dc_id,
      document.id,
      document.access_hash,
      message.id,
    );
    await this.filesService.create(file);
    return file;
  }
}
