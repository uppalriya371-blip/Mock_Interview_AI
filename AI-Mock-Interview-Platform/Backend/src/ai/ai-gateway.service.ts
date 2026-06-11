import { Injectable } from '@nestjs/common';

export type InterviewTurn = { role: 'system' | 'assistant' | 'user'; content: string };

@Injectable()
export class AiGatewayService {
  async generateInterviewQuestion(input: { resume?: unknown; history: InterviewTurn[]; role?: string; difficulty?: string; company?: string; language?: string }) {
    return {
      provider: this.pickProvider(),
      question: `Let's go deeper on ${input.role ?? 'your target role'}. Describe a challenging project and the tradeoffs you made.`,
      difficulty: input.difficulty ?? 'MEDIUM',
      language: input.language ?? 'en',
    };
  }

  async analyzeInterviewAnswer(answer: string) {
    const fillerWordCount = (answer.match(/\b(um|uh|like|basically|actually)\b/gi) ?? []).length;
    return { communicationScore: 78, technicalScore: 74, confidenceScore: 72, grammarScore: 85, behavioralScore: 80, fillerWordCount };
  }

  async parseResume(text: string) {
    return {
      skills: this.extractKeywords(text, ['TypeScript', 'Node.js', 'React', 'AWS', 'PostgreSQL', 'Docker', 'Kubernetes']),
      projects: [], experience: [], education: [], technologies: []
    };
  }

  async transcribeAudio(_storageKey: string) { return { provider: 'whisper/deepgram', transcript: '' }; }
  async synthesizeSpeech(text: string, voice = 'professional') { return { provider: 'elevenlabs', audioUrl: null, text, voice }; }
  async createAvatarSession(script: string) { return { provider: 'tavus/heygen', sessionId: `avatar_${Date.now()}`, script }; }

  private pickProvider() { return process.env.OPENAI_API_KEY ? 'openai' : process.env.GEMINI_API_KEY ? 'gemini' : 'mock'; }
  private extractKeywords(text: string, words: string[]) { return words.filter((word) => text.toLowerCase().includes(word.toLowerCase())); }
}
