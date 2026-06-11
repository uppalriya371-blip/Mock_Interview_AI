import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AiGatewayService } from '../../ai/ai-gateway.service';
@ApiTags('Avatar') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('avatar')
export class AvatarController { constructor(private readonly ai: AiGatewayService) {} @Post('session') create(@Body('script') script: string) { return this.ai.createAvatarSession(script); } @Post('tts') tts(@Body('text') text: string, @Body('voice') voice?: string) { return this.ai.synthesizeSpeech(text, voice); } }
