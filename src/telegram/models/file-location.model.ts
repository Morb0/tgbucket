export class FileLocation {
  constructor(
    public fileId: string,
    public accessHash: string,
    public fileReference: Uint8Array,
  ) {}
}
