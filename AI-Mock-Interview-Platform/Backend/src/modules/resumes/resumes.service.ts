import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { AiGatewayService } from '../../ai/ai-gateway.service';
import { QueueService } from '../../queues/queue.service';
@Injectable()
export class ResumesService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService, private readonly ai: AiGatewayService, private readonly queues: QueueService) {}
  async upload(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Resume file is required');
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.mimetype)) throw new BadRequestException('Only PDF/DOCX resumes are supported');
    const uploaded = await this.storage.upload(file.buffer, { fileName: file.originalname, mimeType: file.mimetype, folder: `users/${userId}/resumes` });
    const resume = await this.prisma.resume.create({ data: { userId, fileName: file.originalname, mimeType: file.mimetype, storageKey: uploaded.key } });
    await this.queues.enqueueResumeParse(resume.id);
    return resume;
  }
  list(userId: string) { return this.prisma.resume.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }); }
  async generateQuestions(userId: string, resumeId: string) {
    const resume = await this.prisma.resume.findFirstOrThrow({ where: { id: resumeId, userId } });
    const structured = resume.structuredData ?? await this.ai.parseResume(resume.parsedText ?? '');
    const prompts = ['Walk me through your most impactful project.', 'Which technical decision would you revisit?', 'How did you measure project success?'];
    return this.prisma.interviewQuestion.createManyAndReturn({ data: prompts.map((prompt) => ({ resumeId, prompt, metadata: structured })) });
  }
}
