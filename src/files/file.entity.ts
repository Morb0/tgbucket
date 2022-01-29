import { BigIntType, Entity, Property } from '@mikro-orm/core';

import { BaseEntity } from '../common/base.entity';

@Entity()
export class FileEntity extends BaseEntity {
  @Property()
  mimetype!: string;

  @Property()
  size!: number;

  @Property()
  dcId!: number;

  @Property({ type: BigIntType })
  fileId!: string;

  @Property({ type: BigIntType })
  fileAccessHash!: string;

  @Property()
  messageId!: number;

  constructor(
    mimetype: string,
    size: number,
    dcId: number,
    fileId: string,
    fileAccessHash: string,
    messageId: number,
  ) {
    super();
    this.mimetype = mimetype;
    this.size = size;
    this.dcId = dcId;
    this.fileId = fileId;
    this.fileAccessHash = fileAccessHash;
    this.messageId = messageId;
  }
}
