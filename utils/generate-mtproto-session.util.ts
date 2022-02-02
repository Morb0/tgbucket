import * as MTProto from '@mtproto/core';
import * as fs from 'fs';
import { stdin as input, stdout as output } from 'process';
import * as readline from 'readline';

const rl = readline.createInterface({ input, output });
const API_ID = '';
const API_HASH = '';

const store: Record<string, string> = {};
const api = new MTProto({
  api_id: Number(API_ID),
  api_hash: API_HASH,
  storageOptions: {
    instance: {
      get: async (key: string) => store[key],
      set: async (key: string, value: string) => {
        store[key] = value;
      },
    },
  },
});

api.updateInitConnectionParams({
  platform: 'Web',
  system_version: '1.1.1',
  device_model: 'tgbucket',
  app_name: 'TGBucket',
  app_version: '1.1.1',
});

(async () => {
  try {
    await createSession();
    process.exit(0);
  } catch (e) {
    console.error('Failed to create session', e);
    process.exit(1);
  }
})();

/* Core */
async function createSession(): Promise<void> {
  try {
    await logIn();
  } catch (e: any) {
    if (e.error_message === 'SESSION_PASSWORD_NEEDED') {
      console.log('Account have enabled 2FA');
      await logIn2FA();
      return;
    }

    throw e;
  }
}

async function logIn(): Promise<void> {
  const phone = await prompt('Phone (without +):');
  console.log('phone', phone, phone.length);
  const { phone_code_hash } = await sendCode(phone);

  const code = await prompt('Code:');
  const signInResult = await signIn(code, phone, phone_code_hash);

  console.debug('signInResult', signInResult);
  saveSessions();
}

async function logIn2FA(): Promise<void> {
  const password = await prompt('Password:');
  const { srp_id, current_algo, srp_B } = await getPassword();
  const { g, p, salt1, salt2 } = current_algo;
  const { A, M1 } = await (api as any).crypto.getSRPParams({
    g,
    p,
    salt1,
    salt2,
    gB: srp_B,
    password,
  });

  const checkPasswordResult = await checkPassword(srp_id, A, M1);
  console.debug('checkPasswordResult', checkPasswordResult);
  saveSessions();
}

function saveSessions(): void {
  const session = JSON.stringify(store);
  console.log('Session created:', session);
  fs.writeFileSync('./session.json', session);
}

/* MTProto */
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

function getPassword() {
  return api.call('account.getPassword');
}

function checkPassword(srpId: string, A: string, M1: string) {
  return api.call('auth.checkPassword', {
    password: {
      _: 'inputCheckPasswordSRP',
      srp_id: srpId,
      A,
      M1,
    },
  });
}

/* Utils */
function prompt(text: string): Promise<string> {
  return new Promise<string>((resolve) => {
    rl.question(text + ' ', (input) => resolve(input));
  });
}
