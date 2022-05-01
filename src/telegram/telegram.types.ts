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
  // ...
}

export interface ResolvedPeer {
  _: 'contacts.resolvedPeer';
  peer: PeerType;
  chats: ChatType[];
  users: UserType[];
}

export type PeerType = PeerUser | PeerChat | PeerChannel;

export interface PeerUser {
  _: 'peerUser';
  user_id: string;
}

export interface PeerChat {
  _: 'peerChat';
  chat_id: string;
}

export interface PeerChannel {
  _: 'peerChannel';
  channel_id: string;
}

export type ChatType = Chat | Channel;

export interface Chat {
  _: 'chat';
  id: string;
  // ...
}

export interface Channel {
  _: 'channel';
  id: string;
  access_hash: string;
  // ...
}

export type UserType = User | UserEmpty;

export interface User {
  _: 'user';
  id: string;
  access_hash: string;
  // ...
}

export interface UserEmpty {
  _: 'userEmpty';
  id: string;
}

export type InputPeer = InputPeerChat | InputPeerUser | InputPeerChannel;

export interface InputPeerChat {
  _: 'inputPeerChat';
  chat_id: string;
}

export interface InputPeerUser {
  _: 'inputPeerUser';
  user_id: string;
  access_hash: string;
}

export interface InputPeerChannel {
  _: 'inputPeerChannel';
  channel_id: string;
  access_hash: string;
}

export type DocumentAttribute = DocumentAttributeFilename;

export interface DocumentAttributeFilename {
  _: 'documentAttributeFilename';
  file_name: string;
}
