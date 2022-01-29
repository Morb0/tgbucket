import { Controller, Post, Req, Res } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

import { FileEntity } from './files/file.entity';
import { UploadFile } from './upload/models/upload-file.model';
import { UploadService } from './upload/upload.service';

@Controller('files')
export class FilesController {
  private readonly MAX_FILE_SIZE = 2097152000; // 2000MiB

  constructor(private readonly uploadService: UploadService) {}

  @Post()
  async uploadFile(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<FileEntity | void> {
    const contentType = req.headers?.['content-type'];
    if (!contentType) {
      reply.status(400).send('Header Content-Type is required');
      return;
    }

    const contentLength = req.headers?.['content-length'];
    if (!contentLength) {
      reply.status(400).send('Header Content-Length is required');
      return;
    }

    const fileSize = Number(contentLength);
    if (isNaN(fileSize)) {
      reply.status(400).send('Header Content-Length value must be a number');
      return;
    }
    if (fileSize > this.MAX_FILE_SIZE) {
      reply.status(400).send('Max file size is 2000MiB');
      return;
    }

    return this.uploadService.processFile(
      new UploadFile(contentType, fileSize, req.raw),
    );
  }

  // @Get(':id')
  // async downloadFile(
  //   @Res({ passthrough: true }) res: Response,
  //   @Param('id') fileId: string,
  // ): Promise<StreamableFile> {
  //   const { fileData, mimetype, filename } =
  //     await this.downloadService.processFile(fileId);
  //
  //   res.set({
  //     'Content-Type': mimetype,
  //     'Content-Disposition': `attachment; filename="${filename}"`,
  //   });
  //   return new StreamableFile(fileData);
  // }
}
