export class MTProtoException extends Error {
  constructor(public errCode: number, public errMessage: string) {
    super(`MTProto error (${errCode}) ${errMessage}`);
  }
}
