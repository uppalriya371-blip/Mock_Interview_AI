import { Injectable } from '@nestjs/common';

@Injectable()
export class QueueService {
  enqueueResumeParse(resumeId: string) { return Promise.resolve(); }
  enqueueFeedback(interviewId: string) { return Promise.resolve(); }
  enqueueNotification(notificationId: string) { return Promise.resolve(); }
  enqueueMediaAnalysis(recordingId: string) { return Promise.resolve(); }
  enqueueCodeRun(submissionId: string) { return Promise.resolve(); }
}