import { MultipartFile } from 'fastify-multipart';
import { Readable } from 'stream';

export class UploadFile {
  filename!: string;
  mimetype!: string;
  size!: number;
  data!: Readable;

  constructor(file: MultipartFile, data: Readable, size: number) {
    this.filename = file.filename;
    this.mimetype = file.mimetype;
    this.size = size;
    this.data = data;
  }
}
