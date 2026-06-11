import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InterviewsService } from './interviews.service';

@WebSocketGateway({ namespace: 'interviews', cors: { origin: '*' } })
export class InterviewsGateway {
  @WebSocketServer() server!: Server;
  constructor(private readonly interviews: InterviewsService) {}

  @SubscribeMessage('join')
  async join(@MessageBody() body: { interviewId: string }, @ConnectedSocket() socket: Socket) {
    await socket.join(body.interviewId);
    socket.emit('joined', { interviewId: body.interviewId });
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
