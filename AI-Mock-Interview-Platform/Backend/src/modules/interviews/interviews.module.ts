import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiModule } from '../../ai/ai.module';
import { QueueModule } from '../../queues/queue.module';
import { InterviewsController } from './interviews.controller';
import { InterviewsGateway } from './interviews.gateway';
import { InterviewsService } from './interviews.service';
@Module({ imports: [DatabaseModule, AiModule, QueueModule], controllers: [InterviewsController], providers: [InterviewsService, InterviewsGateway], exports: [InterviewsService] })
export class InterviewsModule {}
