import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { AiGatewayService } from './ai-gateway.service';

class ChatDto {
  @IsArray()
  messages!: { role: 'user' | 'assistant'; content: string }[];
}

@ApiTags('AI') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('ai')
export class AiController {
  constructor(private readonly ai: AiGatewayService) {}

  @Post('chat')
  chat(@Body() dto: ChatDto) {
    return this.ai.generateChat(dto.messages ?? []);
  }
}
