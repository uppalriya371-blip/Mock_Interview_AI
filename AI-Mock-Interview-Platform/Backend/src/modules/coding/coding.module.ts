import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiModule } from '../../ai/ai.module';
import { QueueModule } from '../../queues/queue.module';
import { CodingController } from './coding.controller';
import { CodingService } from './coding.service';
@Module({ imports: [DatabaseModule, AiModule, QueueModule], controllers: [CodingController], providers: [CodingService] })
export class CodingModule {}
