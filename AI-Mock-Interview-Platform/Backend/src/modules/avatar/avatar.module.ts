import { Module } from '@nestjs/common';
import { AiModule } from '../../ai/ai.module';
import { AvatarController } from './avatar.controller';
@Module({ imports: [AiModule], controllers: [AvatarController] })
export class AvatarModule {}
