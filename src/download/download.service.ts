import { Injectable } from '@nestjs/common';

import { FilesService } from '../files/files.service';
import { FileLocation } from '../telegram/models/file-location.model';
import { TelegramService } from '../telegram/telegram.service';
import { DownloadFile } from './models/download-file.model';

@Injectable()
export class DownloadService {
  constructor(
    private readonly filesService: FilesService,
    private readonly telegramService: TelegramService,
  ) {}

  async processFile(fileId: string): Promise<DownloadFile> {
    const file = await this.filesService.findFile(fileId);
    if (!file) {
      throw new Error(`File "${fileId}" not exist`);
    }

    const fileReference = await this.telegramService.getMessageFileReference(
      file.messageId,
    );
    const fileData = await this.telegramService.downloadFile(
      new FileLocation(file.fileId, file.fileAccessHash, fileReference),
      file.size,
    );
    return new DownloadFile(fileData, file.mimetype, file.filename);
  }
}
