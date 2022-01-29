/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { registerAs } from '@nestjs/config';

export const mtprotoConfig = registerAs('mtproto', () => {
  const store = JSON.parse(process.env.TELEGRAM_SESSION!);
  return {
    api_id: parseInt(process.env.TELEGRAM_API_ID!, 10),
    api_hash: process.env.TELEGRAM_API_HASH!,
    storageOptions: {
      instance: {
        get: async (key: string) => store[key],
        set: async (key: string, value: string) => {
          store[key] = value;
        },
      },
    },
  };
});
