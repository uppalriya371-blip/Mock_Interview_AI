import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

export type InterviewTurn = { role: 'system' | 'assistant' | 'user'; content: string };

@Injectable()
export class AiGatewayService {
  private groqClient: OpenAI | null = null;
  private openaiClient: OpenAI | null = null;

  private getGroq(): OpenAI | null {
    if (!process.env.GROQ_API_KEY) return null;
    if (!this.groqClient) this.groqClient = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });
    return this.groqClient;
  }

  private getOpenAI(): OpenAI | null {
    if (!process.env.OPENAI_API_KEY) return null;
    if (!this.openaiClient) this.openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return this.openaiClient;
  }

  /** Calls Gemini's generateContent REST API */
  private async callGemini(prompt: string): Promise<string | null> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        },
      );
      if (!res.ok) return null;
      const data: any = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    } catch {
      return null;
    }
  }

  /** Generic chat completion. Tries Groq first (fast + free tier), then OpenAI, then Gemini. */
  private async chatComplete(messages: { role: string; content: string }[], jsonMode = false): Promise<string | null> {
    // 1. Groq (priority — free tier, fast inference)
    const groq = this.getGroq();
    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: messages as any,
          ...(jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
        });
        const content = completion.choices[0]?.message?.content;
        if (content) return content;
      } catch (e) {
        console.error('Groq call failed:', (e as Error).message);
      }
    }

    // 2. OpenAI fallback
    const openai = this.getOpenAI();
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: messages as any,
          ...(jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
        });
        const content = completion.choices[0]?.message?.content;
        if (content) return content;
      } catch (e) {
        console.error('OpenAI call failed:', (e as Error).message);
      }
    }

    // 3. Gemini fallback
    if (process.env.GEMINI_API_KEY) {
      const prompt = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
      const result = await this.callGemini(prompt);
      if (result) return result;
    }

    return null;
  }

  async generateInterviewQuestion(input: { resume?: unknown; history: InterviewTurn[]; role?: string; difficulty?: string; company?: string; language?: string; type?: string }) {
    const systemPrompt = `You are an expert technical interviewer conducting a ${input.type ?? 'TECHNICAL'} interview for a ${input.role ?? 'Software Engineer'} role${input.company ? ` at ${input.company}` : ''}. Difficulty: ${input.difficulty ?? 'MEDIUM'}. Ask one clear, focused interview question or follow-up based on the conversation so far. Respond with ONLY the question text, no preamble, no markdown.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...input.history.map((h) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
    ];
    if (input.history.length === 0) {
      messages.push({ role: 'user', content: 'Begin the interview with your first question. Greet the candidate briefly first.' });
    }

    const result = await this.chatComplete(messages);
    const provider = this.pickProvider();

    if (result) {
      return { provider, question: result.trim(), difficulty: input.difficulty ?? 'MEDIUM', language: input.language ?? 'en' };
    }

    return {
      provider: 'mock',
      question: `[No AI provider configured] Let's go deeper on ${input.role ?? 'your target role'}. Describe a challenging project and the tradeoffs you made. (Add GROQ_API_KEY in Backend/.env for real AI questions.)`,
      difficulty: input.difficulty ?? 'MEDIUM',
      language: input.language ?? 'en',
    };
  }

  async analyzeInterviewAnswer(answer: string) {
    const fillerWordCount = (answer.match(/\b(um|uh|like|basically|actually|you know)\b/gi) ?? []).length;

    if (!answer || answer.trim().length === 0) {
      return { communicationScore: 0, technicalScore: 0, confidenceScore: 0, grammarScore: 0, behavioralScore: 0, fillerWordCount: 0, strengths: [], weaknesses: ['No answers recorded for this interview.'], suggestions: ['Complete an interview by answering questions to get feedback.'] };
    }

    const prompt = `You are an expert interview coach. Analyze the following candidate interview transcript (their answers only). Score each category from 0-100 based on actual content quality. Respond ONLY with valid JSON in this exact shape, no markdown fences:
{"communicationScore": number, "technicalScore": number, "confidenceScore": number, "grammarScore": number, "behavioralScore": number, "strengths": [string, string], "weaknesses": [string, string], "suggestions": [string, string]}

Transcript:
${answer.slice(0, 6000)}`;

    const result = await this.chatComplete([{ role: 'user', content: prompt }], true);

    if (result) {
      try {
        const cleaned = result.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
          communicationScore: this.clampScore(parsed.communicationScore),
          technicalScore: this.clampScore(parsed.technicalScore),
          confidenceScore: this.clampScore(parsed.confidenceScore),
          grammarScore: this.clampScore(parsed.grammarScore),
          behavioralScore: this.clampScore(parsed.behavioralScore),
          fillerWordCount,
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 4) : [],
          weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 4) : [],
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 4) : [],
        };
      } catch (e) {
        console.error('Failed to parse AI analysis JSON:', (e as Error).message);
      }
    }

    const wordCount = answer.trim().split(/\s+/).length;
    const lengthScore = Math.min(100, Math.round((wordCount / 150) * 100));
    return {
      communicationScore: lengthScore,
      technicalScore: lengthScore,
      confidenceScore: Math.max(0, lengthScore - fillerWordCount * 2),
      grammarScore: lengthScore,
      behavioralScore: lengthScore,
      fillerWordCount,
      strengths: wordCount > 50 ? ['Provided detailed responses'] : [],
      weaknesses: fillerWordCount > 5 ? ['High use of filler words'] : [],
      suggestions: ['Add GROQ_API_KEY in Backend/.env for detailed AI-powered feedback.'],
    };
  }

  async parseResume(text: string) {
    const prompt = `Extract structured information from this resume text. Respond ONLY with valid JSON, no markdown fences, in this exact shape:
{"skills": [string], "projects": [{"name": string, "description": string}], "experience": [{"role": string, "company": string, "duration": string}], "education": [{"degree": string, "institution": string}], "technologies": [string]}

Resume text:
${text.slice(0, 8000)}`;

    const result = await this.chatComplete([{ role: 'user', content: prompt }], true);
    if (result) {
      try {
        const cleaned = result.replace(/```json|```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {
        console.error('Failed to parse resume JSON:', (e as Error).message);
      }
    }

    return {
      skills: this.extractKeywords(text, ['TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'Node.js', 'React', 'Angular', 'Vue', 'AWS', 'Azure', 'GCP', 'PostgreSQL', 'MySQL', 'MongoDB', 'Docker', 'Kubernetes', 'Git']),
      projects: [],
      experience: [],
      education: [],
      technologies: [],
    };
  }

  async generateChat(history: { role: 'user' | 'assistant'; content: string }[]) {
    const systemPrompt = 'You are an expert interview preparation coach. Help the candidate practice for technical and behavioral interviews. Give concise, actionable, encouraging responses (2-4 sentences).';
    const messages = [{ role: 'system', content: systemPrompt }, ...history.slice(-10)];
    const result = await this.chatComplete(messages);
    if (result) return { provider: this.pickProvider(), reply: result.trim() };
    return {
      provider: 'mock',
      reply: 'AI coaching requires an API key. Add GROQ_API_KEY (recommended, free tier) in Backend/.env, then restart the backend. Once added, I can give you real, personalized feedback here.',
    };
  }

  async transcribeAudio(_storageKey: string) {
    return { provider: 'none', transcript: '' };
  }

  async synthesizeSpeech(text: string, voice = 'professional') {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) return { provider: 'none', audioUrl: null, text, voice };
    return { provider: 'elevenlabs', audioUrl: null, text, voice, note: 'ElevenLabs key detected; audio synthesis endpoint not yet wired.' };
  }

  async createAvatarSession(script: string) {
    return { provider: 'none', sessionId: `session_${Date.now()}`, script };
  }

  private clampScore(val: any): number {
    const num = Number(val);
    if (isNaN(num)) return 0;
    return Math.max(0, Math.min(100, Math.round(num)));
  }

  private pickProvider() {
    if (process.env.GROQ_API_KEY) return 'groq';
    if (process.env.OPENAI_API_KEY) return 'openai';
    if (process.env.GEMINI_API_KEY) return 'gemini';
    return 'mock';
  }

  private extractKeywords(text: string, words: string[]) {
    return words.filter((word) => text.toLowerCase().includes(word.toLowerCase()));
  }
}
