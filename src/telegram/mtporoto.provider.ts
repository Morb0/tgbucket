import * as MTProto from '@mtproto/core';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MTPROTO } from './telegram.constants';

export const MtprotoProvider: Provider = {
  provide: MTPROTO,
  useFactory: (config: ConfigService) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return new MTProto(config.get('mtproto')!);
  },
  inject: [ConfigService],
};
