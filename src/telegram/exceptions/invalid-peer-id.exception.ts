export class InvalidPeerIdException extends Error {
  constructor(peerId: number) {
    super(`Peer id "${peerId}" is invalid`);
  }
}
