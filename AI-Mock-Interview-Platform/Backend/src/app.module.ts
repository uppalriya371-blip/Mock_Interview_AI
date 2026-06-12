import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { HealthController } from './health.controller';
import { DatabaseModule } from './database/database.module';
import { AiModule } from './ai/ai.module';
import { StorageModule } from './storage/storage.module';
import { QueueModule } from './queues/queue.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ResumesModule } from './modules/resumes/resumes.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { AvatarModule } from './modules/avatar/avatar.module';
import { RecordingsModule } from './modules/recordings/recordings.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { CodingModule } from './modules/coding/coding.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({ pinoHttp: { redact: ['req.headers.authorization', 'req.headers.cookie'] } }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    DatabaseModule,
    AiModule,
    StorageModule,
    QueueModule,
    AuthModule,
    UsersModule,
    ResumesModule,
    InterviewsModule,
    AvatarModule,
    RecordingsModule,
    FeedbackModule,
    CodingModule,
    CompaniesModule,
    RecommendationsModule,
    NotificationsModule,
    PaymentsModule,
    AnalyticsModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}