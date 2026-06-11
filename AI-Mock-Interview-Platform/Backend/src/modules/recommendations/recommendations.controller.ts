import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
@ApiTags('Recommendations') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('recommendations')
export class RecommendationsController { constructor(private readonly prisma: PrismaService) {} @Post('study-plan') create(@CurrentUser() user: any) { return this.prisma.studyPlan.create({ data: { userId: user.sub, readinessScore: 70, weakTopics: ['system design', 'behavioral examples'], dailyTasks: [{ day: 1, task: 'Practice project deep dive' }], generatedBy: 'ai' } }); } @Get('study-plan') list(@CurrentUser() user: any) { return this.prisma.studyPlan.findMany({ where: { userId: user.sub }, orderBy: { createdAt: 'desc' } }); } }
