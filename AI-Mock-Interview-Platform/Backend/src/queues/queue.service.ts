import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
@Injectable()
export class QueueService {
  constructor(@InjectQueue('resume') private readonly resume: Queue, @InjectQueue('feedback') private readonly feedback: Queue, @InjectQueue('notifications') private readonly notifications: Queue, @InjectQueue('media') private readonly media: Queue, @InjectQueue('coding') private readonly coding: Queue) {}
  enqueueResumeParse(resumeId: string) { return this.resume.add('parse', { resumeId }); }
  enqueueFeedback(interviewId: string) { return this.feedback.add('generate', { interviewId }); }
  enqueueNotification(notificationId: string) { return this.notifications.add('send', { notificationId }); }
  enqueueMediaAnalysis(recordingId: string) { return this.media.add('analyze', { recordingId }); }
  enqueueCodeRun(submissionId: string) { return this.coding.add('execute', { submissionId }); }
}
