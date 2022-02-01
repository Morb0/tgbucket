import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

import { FileNotExistException } from './exceptions/file-not-exist.exception';
import { FileEntity } from './file.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: EntityRepository<FileEntity>,
  ) {}

  async create(entity: FileEntity): Promise<void> {
    await this.fileRepository.persistAndFlush(entity);
  }

  async findFileOrThrow(id: string): Promise<FileEntity> {
    const file = await this.fileRepository.findOne({ id });
    if (!file) {
      throw new FileNotExistException(id);
    }
    return file;
  }
}
