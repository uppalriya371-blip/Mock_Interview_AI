import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiGatewayService } from '../../ai/ai-gateway.service';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService, private readonly ai: AiGatewayService) {}

  async generate(interviewId: string) {
    const messages = await this.prisma.interviewMessage.findMany({ where: { interviewId, role: 'user' }, orderBy: { createdAt: 'asc' } });
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

    return this.prisma.feedbackReport.upsert({
      where: { interviewId },
      update: data,
      create: { interviewId, ...data },
    });
  }

  async getOrNull(interviewId: string) {
    return this.prisma.feedbackReport.findUnique({ where: { interviewId } });
  }
}
