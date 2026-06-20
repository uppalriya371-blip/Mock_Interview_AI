import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { AiGatewayService } from '../../ai/ai-gateway.service';

@Injectable()
export class ResumesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly ai: AiGatewayService,
  ) {}

  async upload(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Resume file is required');
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.mimetype)) {
      throw new BadRequestException('Only PDF/DOCX resumes are supported');
    }

    const uploaded = await this.storage.upload(file.buffer, {
      fileName: file.originalname,
      mimeType: file.mimetype,
      folder: `users/${userId}/resumes`,
    });

    const resume = await this.prisma.resume.create({
      data: { userId, fileName: file.originalname, mimeType: file.mimetype, storageKey: uploaded.key },
    });

    // Extract text and run AI parsing synchronously (queue disabled in this environment)
    try {
      const parsedText = await this.extractText(file.buffer, file.mimetype);
      const structuredData = await this.ai.parseResume(parsedText ?? '');
      await this.prisma.resume.update({
        where: { id: resume.id },
        data: { parsedText, structuredData: structuredData as any },
      });
      return this.prisma.resume.findUniqueOrThrow({ where: { id: resume.id } });
    } catch (e) {
      console.error('Resume parsing failed:', (e as Error).message);
      return resume;
    }
  }

  list(userId: string) {
    return this.prisma.resume.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async generateQuestions(userId: string, resumeId: string) {
    const resume = await this.prisma.resume.findFirstOrThrow({ where: { id: resumeId, userId } });
    const structured = resume.structuredData ?? (await this.ai.parseResume(resume.parsedText ?? ''));

    // Ask the AI to generate questions grounded in this resume's actual content
    const prompts = await this.generateResumeQuestions(resume.parsedText ?? '', structured);

    return this.prisma.interviewQuestion.createManyAndReturn({
      data: prompts.map((prompt) => ({ resumeId, prompt, metadata: structured as any })),
    });
  }

  private async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType === 'application/pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(buffer);
        return data.text ?? '';
      } catch (e) {
        console.error('PDF parse failed:', (e as Error).message);
        return '';
      }
    }
    // DOCX text extraction not available without an extra library; return empty so AI parse falls back gracefully.
    return '';
  }

  private async generateResumeQuestions(resumeText: string, structured: any): Promise<string[]> {
    if (!resumeText || resumeText.trim().length === 0) {
      return [
        'Walk me through your most impactful project.',
        'Which technical decision would you revisit, and why?',
        'How did you measure the success of your work?',
      ];
    }
    // Reuse the AI gateway's question-generation pathway with resume context as the "role"
    const result = await this.ai.generateInterviewQuestion({
      history: [],
      role: `a candidate with this resume background: ${resumeText.slice(0, 1500)}`,
      type: 'TECHNICAL',
    });
    // generateInterviewQuestion returns one question; ask 2 more variations for a richer set
    const second = await this.ai.generateInterviewQuestion({
      history: [{ role: 'assistant', content: result.question }, { role: 'user', content: 'Good question. Ask me something different about my experience.' }],
      role: `a candidate with this resume background: ${resumeText.slice(0, 1500)}`,
      type: 'BEHAVIORAL',
    });
    return [result.question, second.question].filter(Boolean);
  }
}
