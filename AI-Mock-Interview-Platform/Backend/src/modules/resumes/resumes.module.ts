import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DatabaseModule } from '../../database/database.module';
import { AiModule } from '../../ai/ai.module';
import { StorageModule } from '../../storage/storage.module';
import { QueueModule } from '../../queues/queue.module';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
@Module({ imports: [DatabaseModule, AiModule, StorageModule, QueueModule, MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } })], controllers: [ResumesController], providers: [ResumesService] })
export class ResumesModule {}
