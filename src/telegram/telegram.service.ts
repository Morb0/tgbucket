import { MTProto, MTProtoError } from '@mtproto/core';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as BlockStream from 'block-stream2';
import { Readable, Transform, TransformCallback } from 'stream';
import { pipeline } from 'stream/promises';

import { UserNotFoundException } from './exceptions/user-not-found.exception';
import { FileLocation } from './models/file-location.model';
import { MTPROTO } from './telegram.constants';
import {
  DocumentAttribute,
  InputFileBig,
  Message,
  ResolvedPeer,
  UpdateNewMessage,
  Updates,
  UploadFile,
  User,
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
    userId: string,
    userAccessHash: string,
    fileId: string,
    fileAccessHash: string,
    fileReference: Uint8Array,
    caption?: string,
  ): Promise<void> {
    await this.callApi('messages.sendMedia', {
      peer: {
        _: 'inputPeerUser',
        user_id: userId,
        access_hash: userAccessHash,
      },
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
    filename?: string,
  ): Promise<UpdateNewMessage> {
    const attributes: DocumentAttribute[] = [];
    if (filename) {
      attributes.push({
        _: 'documentAttributeFilename',
        file_name: filename,
      });
    }

    const updates = await this.callApi<Updates>('messages.sendMedia', {
      peer: {
        _: 'inputPeerChat',
        chat_id: chatId,
      },
      media: {
        _: 'inputMediaUploadedDocument',
        force_file: true,
        attributes,
        mime_type: 'application/octet-stream',
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

  async resolveUserIdByUsernameOrThrow(username: string): Promise<User> {
    const resolvedPeer = await this.callApi<ResolvedPeer>(
      'contacts.resolveUsername',
      {
        username,
      },
    );
    const user = resolvedPeer?.users?.[0];
    if (!user) {
      throw new UserNotFoundException(username);
    }
    return user;
  }

  private async callApi<T = any>(
    method: string,
    params: Record<string, any>,
    options: Record<string, any> = {},
  ): Promise<T> {
    return this.mtproto
      .call(method, params, options)
      .catch(async (err: Error | MTProtoError) => {
        this.logger.error(
          `Failed to call "${method}" method`,
          err?.stack ?? JSON.stringify(err),
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

        return Promise.reject(err);
      });
  }
}
