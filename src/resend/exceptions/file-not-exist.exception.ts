export class FileNotExistException extends Error {
  constructor(fileId: string) {
    super(`File "${fileId}" not exist`);
  }
}
