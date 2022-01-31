import { Readable } from 'stream';

export class UploadFile {
  constructor(
    public mimetype: string,
    public size: number,
    public data: Readable,
    public filename?: string,
  ) {}
}
