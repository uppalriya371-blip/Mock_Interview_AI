import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QueueService } from '../../queues/queue.service';
import { SubmitCodeDto } from './dto/submit-code.dto';
@Injectable()
export class CodingService { constructor(private readonly prisma: PrismaService, private readonly queues: QueueService) {} questions() { return this.prisma.codingQuestion.findMany({ orderBy: { createdAt: 'desc' } }); } question(slug: string) { return this.prisma.codingQuestion.findUniqueOrThrow({ where: { slug }, include: { testCases: { where: { hidden: false } } } }); } async submit(userId: string, dto: SubmitCodeDto) { const submission = await this.prisma.codingSubmission.create({ data: { userId, questionId: dto.questionId, language: dto.language, sourceCode: dto.sourceCode, status: 'QUEUED' } }); await this.queues.enqueueCodeRun(submission.id); return submission; } }
