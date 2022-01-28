import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

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

  async findFile(id: string): Promise<FileEntity | null> {
    return this.fileRepository.findOne({ id });
  }
}
