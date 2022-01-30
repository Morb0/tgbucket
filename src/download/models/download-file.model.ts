import { Readable } from 'stream';

export class DownloadFile {
  constructor(
    public data: Readable,
    public mimetype: string,
    public filename?: string,
  ) {}
}
