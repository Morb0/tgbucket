import { MTProto } from '@mtproto/core';
import dotenv from 'dotenv';
dotenv.config();

const PHONE = '';
const CODE = '';

const store: Record<string, string> = {};
const api = new MTProto({
  api_id: Number(process.env.TELEGRAM_API_ID!),
  api_hash: process.env.TELEGRAM_API_HASH!,
  storageOptions: {
    instance: {
      get: async (key: string) => store[key],
      set: async (key: string, value: string) => {
        store[key] = value;
      },
    },
  },
});

(async () => {
  const user = await getUser();
  console.log('currentUser', user);

  if (!user) {
    try {
      const { phone_code_hash } = await sendCode(PHONE);

      const signInResult = await signIn(CODE, PHONE, phone_code_hash);

      console.log('result', signInResult);
      console.log('session', JSON.stringify(store));
    } catch (err: any) {
      if (err.error_message !== 'SESSION_PASSWORD_NEEDED') {
        console.log(`error:`, err);

        return;
      }

      console.error('2FA is set');
    }
  }
})();

async function getUser() {
  try {
    const user = await api.call('users.getFullUser', {
      id: {
        _: 'inputUserSelf',
      },
    });

    return user;
  } catch (error) {
    return null;
  }
}

function sendCode(phone: string) {
  return api.call('auth.sendCode', {
    phone_number: phone,
    settings: {
      _: 'codeSettings',
    },
  }) as Promise<{ phone_code_hash: string }>;
}

function signIn(code: string, phone: string, phoneCodeHash: string) {
  return api.call('auth.signIn', {
    phone_code: code,
    phone_number: phone,
    phone_code_hash: phoneCodeHash,
  });
}
