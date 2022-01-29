export interface InputFileBig {
  _: 'inputFileBig';
  id: number;
  parts: number;
  name?: string;
}

export interface MessageMediaDocument {
  _: 'messageMediaDocument';
  document: Document;
}

export interface Document {
  _: 'document';
  id: string;
  access_hash: string;
  file_reference: Uint8Array;
  date: number;
  mime_type: string;
  size: number;
  dc_id: number;
  thumbs?: Array<unknown>;
  video_thumbs?: Array<unknown>;
  attributes: Array<unknown>;
}

export interface UploadFile {
  _: 'upload.file';
  type: { _: string };
  mtime: number;
  bytes: Uint8Array;
}

export interface Updates {
  _: 'updates';
  updates: (UpdateNewMessage | unknown)[];
  users: unknown[];
  chats: unknown[];
  date: number;
  seq: number;
}

export interface UpdateNewMessage {
  _: 'updateNewMessage';
  message: Message;
  pts: number;
  pts_count: number;
}

export interface Message {
  _: 'message';
  id: number;
  media: MessageMediaDocument;
  // More...
}
