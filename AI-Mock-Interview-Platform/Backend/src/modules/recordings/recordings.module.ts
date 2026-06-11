import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { StorageModule } from '../../storage/storage.module';
import { QueueModule } from '../../queues/queue.module';
import { RecordingsController } from './recordings.controller';
import { RecordingsService } from './recordings.service';
@Module({ imports: [DatabaseModule, StorageModule, QueueModule], controllers: [RecordingsController], providers: [RecordingsService] })
export class RecordingsModule {}
