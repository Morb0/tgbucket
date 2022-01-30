import { Entity, Property } from '@mikro-orm/core';

import { BaseEntity } from '../common/base.entity';

@Entity()
export class FileEntity extends BaseEntity {
  @Property()
  mimetype!: string;

  @Property()
  size!: number;

  @Property()
  dcId!: number;

  @Property()
  fileId!: string;

  @Property()
  fileAccessHash!: string;

  @Property()
  messageId!: number;

  @Property({ nullable: true })
  filename?: string;

  constructor(
    mimetype: string,
    size: number,
    dcId: number,
    fileId: string,
    fileAccessHash: string,
    messageId: number,
    filename?: string,
  ) {
    super();
    this.mimetype = mimetype;
    this.size = size;
    this.dcId = dcId;
    this.fileId = fileId;
    this.fileAccessHash = fileAccessHash;
    this.messageId = messageId;
    this.filename = filename;
  }
}
