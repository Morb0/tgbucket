declare module '@mtproto/core' {
  declare class LocalStorage {
    set(key: string, value: string): Promise<void>;
    get(key: string): Promise<string | null>;
  }

  declare interface StorageOptions {
    instance: LocalStorage;
  }

  export class MTProto {
    constructor(options: {
      api_id: number;
      api_hash: string;
      test?: boolean;
      storageOptions?: StorageOptions;
    });

    call(
      method: string,
      params: Record<string, any>,
      options?: {
        dcId?: number;
        syncAuth?: boolean;
      },
    ): Promise<any>;

    setDefaultDc(dcId: number): Promise<string>;

    updates: {
      // eslint-disable-next-line @typescript-eslint/ban-types
      on(updateName: string, handler: Function): void;
      off(updateName: string): void;
      removeAllListeners(): void;
    };
  }

  export class MTProtoError extends Error {
    error_code: number;
    error_message: string;
  }

  const mtproto: typeof MTProto;
  export = mtproto;
}
