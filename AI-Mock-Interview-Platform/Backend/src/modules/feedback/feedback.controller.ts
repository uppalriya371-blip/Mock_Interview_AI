import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';

@ApiTags('Feedback') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Post(':interviewId/generate')
  generate(@Param('interviewId') id: string) {
    return this.feedback.generate(id);
  }

  @Get(':interviewId')
  async get(@Param('interviewId') id: string) {
    const report = await this.feedback.getOrNull(id);
    return report ?? { notGenerated: true };
  }
}
