import { MTProto, MTProtoError } from '@mtproto/core';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as BlockStream from 'block-stream2';
import { Readable, Transform, TransformCallback } from 'stream';
import { pipeline } from 'stream/promises';

import { PeerType } from './enums/peer-type.enum';
import { InvalidPeerIdException } from './exceptions/invalid-peer-id.exception';
import { MTProtoException } from './exceptions/mtproto.exception';
import { UserNotFoundException } from './exceptions/user-not-found.exception';
import { FileLocation } from './models/file-location.model';
import {
  MAX_CHANNEL_ID,
  MAX_USER_ID,
  MIN_CHANNEL_ID,
  MIN_CHAT_ID,
  MTPROTO,
} from './telegram.constants';
import {
  DocumentAttribute,
  InputFileBig,
  InputPeer,
  InputPeerUser,
  Message,
  ResolvedPeer,
  UpdateNewMessage,
  Updates,
  UploadFile,
} from './telegram.types';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @Inject(MTPROTO) private readonly mtproto: MTProto,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const token = this.config.get('TELEGRAM_BOT_TOKEN');
    await this.loginBot(token);
  }

  async loginBot(token: string): Promise<void> {
    const res = await this.callApi('auth.importBotAuthorization', {
      bot_auth_token: token,
    });
    const username = res?.user?.username;
    this.logger.log(`Successfully logged in to Telegram as "${username}"`);
  }

  async uploadFile(fileStream: Readable, size: number): Promise<InputFileBig> {
    const partSize = 512 * 1024; // 512kb
    const totalParts = Math.ceil(size / partSize);
    const fileId = Date.now();
    let partIdx = 0;
    const uploadTelegramStream = new Transform({
      transform: (
        chunk: Buffer,
        encoding: BufferEncoding,
        callback: TransformCallback,
      ) => {
        this.uploadBigFilePart(fileId, partIdx, totalParts, chunk)
          .then((isUploaded) => {
            if (!isUploaded) {
              callback(new Error(`Failed to upload ${partIdx} file part`));
            }
            partIdx++;
            callback();
          })
          .catch((e) => callback(e));
      },
    });

    const blockStream = new BlockStream(partSize);
    return pipeline(fileStream, blockStream, uploadTelegramStream).then(() => ({
      _: 'inputFileBig',
      id: fileId,
      parts: totalParts,
    }));
  }

  async uploadBigFilePart(
    fileId: number,
    part: number,
    totalParts: number,
    bytes: Uint8Array,
  ): Promise<boolean> {
    return this.callApi('upload.saveBigFilePart', {
      file_id: fileId,
      file_part: part,
      file_total_parts: totalParts,
      bytes,
    });
  }

  downloadFile(fileLocation: FileLocation): Readable {
    const partSize = 512 * 1024; // 512kb
    let offset = 0;
    const stream = new Readable({
      read: () => {
        this.getFileDocument(fileLocation, offset, partSize)
          .then(({ bytes }) => {
            stream.push(bytes);
            offset += partSize;
            if (bytes.length < partSize) {
              stream.push(null);
            }
          })
          .catch((e) => stream.destroy(e));
      },
    });
    return stream;
  }

  async getFileDocument(
    fileLocation: FileLocation,
    offset: number,
    limit: number,
  ): Promise<UploadFile> {
    return this.callApi<UploadFile>('upload.getFile', {
      offset,
      limit,
      location: {
        _: 'inputDocumentFileLocation',
        id: fileLocation.fileId,
        access_hash: fileLocation.accessHash,
        file_reference: fileLocation.fileReference,
      },
    });
  }

  async sendDocumentToUser(
    inputPeer: InputPeer,
    fileId: string,
    fileAccessHash: string,
    fileReference: Uint8Array,
    caption?: string,
  ): Promise<void> {
    await this.callApi('messages.sendMedia', {
      peer: inputPeer,
      media: {
        _: 'inputMediaDocument',
        id: {
          _: 'inputDocument',
          id: fileId,
          access_hash: fileAccessHash,
          file_reference: fileReference,
        },
      },
      message: caption,
      random_id: Date.now(),
    });
  }

  async uploadAndSendDocumentToChat(
    chatId: string,
    inputFile: InputFileBig,
    mimetype = 'application/octet-stream',
    filename?: string,
    ignoreType = false,
  ): Promise<UpdateNewMessage> {
    const attributes: DocumentAttribute[] = [];
    if (filename) {
      attributes.push({
        _: 'documentAttributeFilename',
        file_name: filename,
      });
    }
    if (!ignoreType) {
      if (mimetype === 'video/mp4') {
        attributes.push({
          _: 'documentAttributeVideo',
          supports_streaming: true,
        });
      }
      if (mimetype === 'audio/mpeg') {
        attributes.push({
          _: 'documentAttributeAudio',
        });
      }
    }

    const updates = await this.callApi<Updates>('messages.sendMedia', {
      peer: {
        _: 'inputPeerChat',
        chat_id: chatId,
      },
      media: {
        _: 'inputMediaUploadedDocument',
        attributes,
        mime_type: mimetype,
        file: inputFile,
      },
      random_id: Date.now(),
    });
    const newMessageUpdate = updates.updates.find((update) =>
      this.isNewMessageUpdate(update),
    ) as UpdateNewMessage;
    if (!newMessageUpdate) {
      throw new Error('Telegram not return new message update');
    }

    return newMessageUpdate;
  }

  private isNewMessageUpdate(update: unknown): update is UpdateNewMessage {
    return (update as UpdateNewMessage)?._ === 'updateNewMessage';
  }

  async getMessageFileReference(messageId: number): Promise<Uint8Array> {
    const { messages } = await this.callApi<{ messages: Message[] }>(
      'messages.getMessages',
      {
        id: [
          {
            _: 'inputMessageID',
            id: messageId,
          },
        ],
      },
    );

    if (!messages[0]) {
      throw new Error(`Failed get "${messageId}" message file reference`);
    }

    return messages[0].media.document.file_reference;
  }

  async resolveInputPeer(peerId: string | number): Promise<InputPeer> {
    if (typeof peerId === 'number') {
      const peerType = this.getPeerType(peerId);
      if (peerType === PeerType.User) {
        return {
          _: 'inputPeerUser',
          user_id: String(peerId),
          access_hash: '0',
        };
      } else if (peerType === PeerType.Chat) {
        return {
          _: 'inputPeerChat',
          chat_id: String(-peerId),
        };
      } else {
        return {
          _: 'inputPeerChannel',
          channel_id: String(this.getChannelId(peerId)),
          access_hash: '0',
        };
      }
    }

    return this.resolvePeerByUsername(peerId);
  }

  private async resolvePeerByUsername(
    username: string,
  ): Promise<InputPeerUser> {
    const resolvedPeer = await this.callApi<ResolvedPeer>(
      'contacts.resolveUsername',
      {
        username,
      },
    );

    const user = resolvedPeer?.users?.[0];
    if (!user || user._ === 'userEmpty') {
      throw new UserNotFoundException(username);
    }

    return {
      _: 'inputPeerUser',
      user_id: user.id,
      access_hash: user.access_hash,
    };
  }

  private getPeerType(peerId: number): PeerType {
    if (peerId < 0) {
      if (peerId <= MIN_CHAT_ID) {
        return PeerType.Chat;
      }
      if (peerId >= MIN_CHANNEL_ID || peerId < MAX_CHANNEL_ID) {
        return PeerType.Chanel;
      }
    } else if (peerId > 0 || peerId <= MAX_USER_ID) {
      return PeerType.User;
    }

    throw new InvalidPeerIdException(peerId);
  }

  private getChannelId(peerId: number): number {
    return MAX_CHANNEL_ID - peerId;
  }

  private async callApi<T = any>(
    method: string,
    params: Record<string, any>,
    options: Record<string, any> = {},
  ): Promise<T> {
    return this.mtproto
      .call(method, params, options)
      .catch(async (err: MTProtoError) => {
        this.logger.error(
          `Failed to call "${method}" method`,
          JSON.stringify(err),
        );

        if ('error_code' in err) {
          const { error_code, error_message } = err;

          if (error_code === 420) {
            const seconds = +error_message.split('FLOOD_WAIT_')[1];
            const ms = seconds * 1000;

            this.logger.warn(`Flood wait ${ms}ms`);
            await new Promise((resolve) => setTimeout(resolve, ms));

            return this.callApi(method, params, options);
          }

          if (error_code === 303) {
            const [type, dcId] = error_message.split('_MIGRATE_');

            this.logger.warn(`Wrong "${type}" DC`);

            // NOTE: If auth.sendCode call on incorrect DC need change default DC, because call auth.signIn on incorrect DC return PHONE_CODE_EXPIRED error
            if (type === 'PHONE') {
              await this.mtproto.setDefaultDc(+dcId);
            } else {
              options = {
                ...options,
                dcId: +dcId,
              };
            }

            return this.callApi(method, params, options);
          }
        }

        throw new MTProtoException(err.error_code, err.error_message);
      });
  }
}
