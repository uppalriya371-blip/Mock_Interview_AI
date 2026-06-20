import { Injectable } from '@nestjs/common';
import { InterviewStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AiGatewayService } from '../../ai/ai-gateway.service';
import { QueueService } from '../../queues/queue.service';
import { CreateInterviewDto } from './dto/create-interview.dto';

@Injectable()
export class InterviewsService {
  constructor(private readonly prisma: PrismaService, private readonly ai: AiGatewayService, private readonly queues: QueueService) {}

  create(userId: string, dto: CreateInterviewDto) {
    return this.prisma.interview.create({
      data: { userId, title: dto.title, type: dto.type, difficulty: dto.difficulty, resumeId: dto.resumeId, companyId: dto.companyId, language: dto.language ?? 'en' },
    });
  }

  list(userId: string) {
    return this.prisma.interview.findMany({ where: { userId }, include: { report: true }, orderBy: { createdAt: 'desc' } });
  }

  get(userId: string, id: string) {
    return this.prisma.interview.findFirstOrThrow({ where: { id, userId }, include: { messages: true, questions: true, recordings: true, report: true } });
  }

  async start(userId: string, id: string) {
    await this.prisma.interview.findFirstOrThrow({ where: { id, userId } });
    return this.prisma.interview.update({ where: { id }, data: { status: InterviewStatus.LIVE, startedAt: new Date() } });
  }

  async complete(userId: string, id: string) {
    await this.prisma.interview.findFirstOrThrow({ where: { id, userId } });
    const interview = await this.prisma.interview.update({ where: { id }, data: { status: InterviewStatus.COMPLETED, endedAt: new Date() } });

    // Generate feedback report synchronously (no background queue in this environment)
    try {
      const messages = await this.prisma.interviewMessage.findMany({ where: { interviewId: id, role: 'user' }, orderBy: { createdAt: 'asc' } });
      const transcript = messages.map((m) => m.content).join('\n');
      const analysis = await this.ai.analyzeInterviewAnswer(transcript);
      const readinessScore = Math.round(
        (analysis.communicationScore + analysis.technicalScore + analysis.confidenceScore + analysis.grammarScore + analysis.behavioralScore) / 5,
      );
      const data = {
        communicationScore: analysis.communicationScore,
        technicalScore: analysis.technicalScore,
        confidenceScore: analysis.confidenceScore,
        grammarScore: analysis.grammarScore,
        behavioralScore: analysis.behavioralScore,
        fillerWordCount: analysis.fillerWordCount,
        readinessScore,
        strengths: analysis.strengths ?? [],
        weaknesses: analysis.weaknesses ?? [],
        suggestions: analysis.suggestions ?? [],
        rawAnalysis: analysis as any,
      };
      await this.prisma.feedbackReport.upsert({ where: { interviewId: id }, update: data, create: { interviewId: id, ...data } });
    } catch (e) {
      console.error('Feedback generation failed:', (e as Error).message);
    }

    return interview;
  }

  async handleUserResponse(interviewId: string, content: string) {
    await this.prisma.interviewMessage.create({ data: { interviewId, role: 'user', content } });
    const history = await this.prisma.interviewMessage.findMany({ where: { interviewId }, orderBy: { createdAt: 'asc' }, take: 20 });
    const interview = await this.prisma.interview.findUnique({ where: { id: interviewId } });
    const next = await this.ai.generateInterviewQuestion({
      history: history.map((m) => ({ role: m.role as any, content: m.content })),
      role: interview?.title,
      difficulty: interview?.difficulty,
      type: interview?.type,
      language: interview?.language,
    });
    return this.prisma.interviewMessage.create({ data: { interviewId, role: 'assistant', content: next.question, metadata: next as any } });
  }
}
