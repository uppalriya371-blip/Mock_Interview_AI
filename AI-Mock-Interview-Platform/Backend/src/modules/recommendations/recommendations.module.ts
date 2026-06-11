import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { RecommendationsController } from './recommendations.controller';
@Module({ imports: [DatabaseModule], controllers: [RecommendationsController] })
export class RecommendationsModule {}
