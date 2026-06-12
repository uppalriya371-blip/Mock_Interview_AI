import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { QueueModule } from '../../queues/queue.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [DatabaseModule, QueueModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}