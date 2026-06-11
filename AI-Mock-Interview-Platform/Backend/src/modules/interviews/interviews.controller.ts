import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { InterviewsService } from './interviews.service';
@ApiTags('Interviews') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviews: InterviewsService) {}
  @Post() create(@CurrentUser() user: any, @Body() dto: CreateInterviewDto) { return this.interviews.create(user.sub, dto); }
  @Get() list(@CurrentUser() user: any) { return this.interviews.list(user.sub); }
  @Get(':id') get(@CurrentUser() user: any, @Param('id') id: string) { return this.interviews.get(user.sub, id); }
  @Post(':id/start') start(@CurrentUser() user: any, @Param('id') id: string) { return this.interviews.start(user.sub, id); }
  @Post(':id/complete') complete(@CurrentUser() user: any, @Param('id') id: string) { return this.interviews.complete(user.sub, id); }
}
