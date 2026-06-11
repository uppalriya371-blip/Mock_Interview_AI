import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiModule } from '../../ai/ai.module';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
@Module({ imports: [DatabaseModule, AiModule], controllers: [FeedbackController], providers: [FeedbackService] })
export class FeedbackModule {}
