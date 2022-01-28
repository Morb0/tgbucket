import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { FileEntity } from './file.entity';
import { FilesService } from './files.service';

@Module({
  imports: [MikroOrmModule.forFeature([FileEntity])],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
