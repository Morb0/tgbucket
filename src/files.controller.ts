import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as path from 'path';

import { DownloadService } from './download/download.service';
import { FileEntity } from './files/file.entity';
import { ResendService } from './resend/resend.service';
import { UploadFile } from './upload/models/upload-file.model';
import { UploadService } from './upload/upload.service';

@Controller('files')
export class FilesController {
  private readonly MAX_FILE_SIZE = 2097152000; // 2000MiB

  constructor(
    private readonly uploadService: UploadService,
    private readonly downloadService: DownloadService,
    private readonly resendService: ResendService,
  ) {}

  @Post()
  async uploadFile(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<FileEntity | void> {
    const contentType = req.headers?.['content-type'];
    if (!contentType) {
      res.status(400).send('Header Content-Type is required');
      return;
    }

    const contentLength = req.headers?.['content-length'];
    if (!contentLength) {
      res.status(400).send('Header Content-Length is required');
      return;
    }

    let filename = req.headers?.['x-filename'];
    filename = Array.isArray(filename) ? filename[0] : filename;
    if (filename) {
      filename = path.basename(filename);
    }

    const fileSize = Number(contentLength);
    if (isNaN(fileSize)) {
      res.status(400).send('Header Content-Length value must be a number');
      return;
    }
    if (fileSize > this.MAX_FILE_SIZE) {
      res.status(400).send('Max file size is 2000MiB');
      return;
    }

    return this.uploadService.processFile(
      new UploadFile(contentType, fileSize, req, filename),
    );
  }

  @Get(':id')
  async downloadFile(
    @Res({ passthrough: true }) res: Response,
    @Param('id', ParseUUIDPipe) fileId: string,
  ): Promise<StreamableFile | undefined> {
    const file = await this.downloadService.processFile(fileId);
    return new StreamableFile(file.data, {
      type: file.mimetype,
      disposition: `attachment; filename="${file.filename}"`,
    });
  }

  @Post(':id/resend')
  @HttpCode(HttpStatus.OK)
  async sendFile(
    @Param('id', ParseUUIDPipe) fileId: string,
    @Body('username') username: string,
  ): Promise<void> {
    return this.resendService.resendFile(fileId, username);
  }
}
