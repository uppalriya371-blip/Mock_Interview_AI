import { Injectable } from '@nestjs/common';
import { InterviewStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AiGatewayService } from '../../ai/ai-gateway.service';
import { QueueService } from '../../queues/queue.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
@Injectable()
export class InterviewsService {
  constructor(private readonly prisma: PrismaService, private readonly ai: AiGatewayService, private readonly queues: QueueService) {}
  create(userId: string, dto: CreateInterviewDto) { return this.prisma.interview.create({ data: { userId, title: dto.title, type: dto.type, difficulty: dto.difficulty, resumeId: dto.resumeId, companyId: dto.companyId, language: dto.language ?? 'en' } }); }
  list(userId: string) { return this.prisma.interview.findMany({ where: { userId }, include: { report: true }, orderBy: { createdAt: 'desc' } }); }
  get(userId: string, id: string) { return this.prisma.interview.findFirstOrThrow({ where: { id, userId }, include: { messages: true, questions: true, recordings: true, report: true } }); }
  async start(userId: string, id: string) { await this.prisma.interview.findFirstOrThrow({ where: { id, userId } }); return this.prisma.interview.update({ where: { id }, data: { status: InterviewStatus.LIVE, startedAt: new Date() } }); }
  async complete(userId: string, id: string) { await this.prisma.interview.findFirstOrThrow({ where: { id, userId } }); const interview = await this.prisma.interview.update({ where: { id }, data: { status: InterviewStatus.COMPLETED, endedAt: new Date() } }); await this.queues.enqueueFeedback(id); return interview; }
  async handleUserResponse(interviewId: string, content: string) {
    await this.prisma.interviewMessage.create({ data: { interviewId, role: 'user', content } });
    const history = await this.prisma.interviewMessage.findMany({ where: { interviewId }, orderBy: { createdAt: 'asc' }, take: 20 });
    const next = await this.ai.generateInterviewQuestion({ history: history.map((m) => ({ role: m.role as any, content: m.content })) });
    return this.prisma.interviewMessage.create({ data: { interviewId, role: 'assistant', content: next.question, metadata: next } });
  }
}
