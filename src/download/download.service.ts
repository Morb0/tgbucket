import { Injectable, Logger } from '@nestjs/common';
import * as mime from 'mime';

import { FilesService } from '../files/files.service';
import { FileLocation } from '../telegram/models/file-location.model';
import { TelegramService } from '../telegram/telegram.service';
import { DownloadFile } from './models/download-file.model';

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly filesService: FilesService,
    private readonly telegramService: TelegramService,
  ) {}

  async processFile(fileId: string): Promise<DownloadFile> {
    this.logger.log(`Downloading file "${fileId}"`);
    const file = await this.filesService.findFileOrThrow(fileId);
    const fileReference = await this.telegramService.getMessageFileReference(
      file.messageId,
    );
    const fileStream = this.telegramService.downloadFile(
      new FileLocation(file.fileId, file.fileAccessHash, fileReference),
    );
    const filename = file.filename ?? this.generateFilename(file.mimetype);
    return new DownloadFile(fileStream, file.mimetype, filename);
  }

  private generateFilename(mimetype: string): string {
    const name = Date.now().toString();
    const extension = mime.getExtension(mimetype);
    return `${name}${extension ? `.${extension}` : ''}`;
  }
}
