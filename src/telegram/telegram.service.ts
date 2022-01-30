import { MTProto, MTProtoError } from '@mtproto/core';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Readable } from 'stream';

import { FileLocation } from './models/file-location.model';
import { MTPROTO } from './telegram.constants';
import {
  InputFileBig,
  Message,
  UpdateNewMessage,
  Updates,
  UploadFile,
} from './telegram.types';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(this.constructor.name);
  private readonly PART_SIZE = 512 * 1024; // 512kb

  constructor(@Inject(MTPROTO) private readonly mtproto: MTProto) {}

  async uploadFile(stream: Readable, size: number): Promise<InputFileBig> {
    return new Promise((resolve, reject) => {
      const totalParts = Math.ceil(size / this.PART_SIZE);
      const fileId = Date.now();
      let partIdx = 0;
      let bufferPart = Buffer.alloc(this.PART_SIZE);
      let bufferOffset = 0;
      let isBufferFilled = false;
      let processedBytes = 0;
      let remainLastChunk: Buffer | undefined;
      let chunkIdx = 0;

      this.logger.verbose(`Upload ${totalParts} parts of file`);
      stream.on('data', async (chunk: Buffer) => {
        this.logger.verbose(
          `Processing ${chunkIdx} chunk with ${chunk.byteLength} bytes`,
        );
        chunkIdx++;

        if (remainLastChunk) {
          bufferPart.fill(remainLastChunk, bufferOffset);
          bufferOffset += remainLastChunk.length;
          remainLastChunk = undefined;
        }

        let buffToFill = chunk;
        const isBufferOverflowing =
          bufferOffset + chunk.byteLength > bufferPart.byteLength;
        if (isBufferOverflowing) {
          const remainSize = bufferPart.byteLength - bufferOffset;
          buffToFill = chunk.slice(0, remainSize);
          remainLastChunk = chunk.slice(remainSize);
          isBufferFilled = true;
        }

        bufferPart.fill(buffToFill, bufferOffset);
        bufferOffset += buffToFill.length;
        processedBytes += chunk.length;
        this.logger.verbose(`Processed bytes: ${processedBytes}/${size}`);

        const isLastChunk = processedBytes === size;
        if (isLastChunk) {
          bufferPart = bufferPart.slice(0, bufferOffset);
          isBufferFilled = true;
        }

        if (isBufferFilled) {
          stream.pause();
          this.logger.verbose(`Buffer for ${partIdx} part filled`);
          const isUploaded = await this.uploadBigFilePart(
            fileId,
            partIdx,
            totalParts,
            bufferPart,
          );
          if (!isUploaded) {
            return reject(new Error(`Failed to upload ${partIdx} file part`));
          }

          partIdx++;
          isBufferFilled = false;
          bufferOffset = 0;
          stream.resume();
        }
      });

      stream.on('end', () => {
        resolve({
          _: 'inputFileBig',
          id: fileId,
          parts: totalParts,
        });
      });
    });
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

  async downloadFile(
    fileLocation: FileLocation,
    fileSize: number,
  ): Promise<Readable> {
    const totalParts = Math.ceil(fileSize / this.PART_SIZE);
    const stream = new Readable({
      highWaterMark: this.PART_SIZE,
    });
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    stream._read = () => {};

    const asyncProcess = async () => {
      try {
        for (let partIdx = 0; partIdx < totalParts; partIdx++) {
          const offset = this.PART_SIZE * partIdx;
          const filePart = await this.getFileDocument(
            fileLocation,
            offset,
            this.PART_SIZE,
          );
          stream.push(filePart.bytes);
        }
        stream.push(null);
      } catch (e) {
        stream.destroy(e as Error);
      }
    };
    asyncProcess();

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

  async sendMediaToSelf(inputFile: InputFileBig): Promise<UpdateNewMessage> {
    const updates = await this.callApi<Updates>('messages.sendMedia', {
      peer: {
        _: 'inputPeerSelf',
      },
      media: {
        _: 'inputMediaUploadedDocument',
        force_file: true,
        attributes: [],
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
