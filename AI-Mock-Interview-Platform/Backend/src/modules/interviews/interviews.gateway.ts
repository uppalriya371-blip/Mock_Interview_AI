import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InterviewsService } from './interviews.service';
import { PrismaService } from '../../database/prisma.service';
import { AiGatewayService } from '../../ai/ai-gateway.service';

@WebSocketGateway({ namespace: 'interviews', cors: { origin: '*' } })
export class InterviewsGateway {
  @WebSocketServer() server!: Server;
  constructor(
    private readonly interviews: InterviewsService,
    private readonly prisma: PrismaService,
    private readonly ai: AiGatewayService,
  ) {}

  @SubscribeMessage('join')
  async join(@MessageBody() body: { interviewId: string }, @ConnectedSocket() socket: Socket) {
    await socket.join(body.interviewId);
    socket.emit('joined', { interviewId: body.interviewId });

    // If this interview has no messages yet, generate and send the opening question
    const existing = await this.prisma.interviewMessage.findMany({ where: { interviewId: body.interviewId } });
    if (existing.length === 0) {
      const interview = await this.prisma.interview.findUnique({ where: { id: body.interviewId } });
      const opening = await this.ai.generateInterviewQuestion({
        history: [],
        role: interview?.title,
        difficulty: interview?.difficulty,
        type: interview?.type,
        language: interview?.language,
      });
      const message = await this.prisma.interviewMessage.create({
        data: { interviewId: body.interviewId, role: 'assistant', content: opening.question, metadata: opening as any },
      });
      this.server.to(body.interviewId).emit('ai.message', message);
    } else {
      const lastAi = existing.filter((m) => m.role === 'assistant').pop();
      if (lastAi) this.server.to(body.interviewId).emit('ai.message', lastAi);
    }
  }

  @SubscribeMessage('user.message')
  async onMessage(@MessageBody() body: { interviewId: string; content: string }, @ConnectedSocket() socket: Socket) {
    this.server.to(body.interviewId).emit('transcript.partial', { role: 'user', content: body.content });
    const reply = await this.interviews.handleUserResponse(body.interviewId, body.content);
    this.server.to(body.interviewId).emit('ai.message', reply);
    return reply;
  }

  @SubscribeMessage('voice.chunk')
  onVoiceChunk(@MessageBody() body: { interviewId: string; sequence: number; audioBase64: string }) {
    this.server.to(body.interviewId).emit('voice.ack', { sequence: body.sequence });
  }
}
