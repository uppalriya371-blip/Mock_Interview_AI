import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { CodingService } from './coding.service';
@ApiTags('Coding') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('coding')
export class CodingController { constructor(private readonly coding: CodingService) {} @Get('questions') questions() { return this.coding.questions(); } @Get('questions/:slug') question(@Param('slug') slug: string) { return this.coding.question(slug); } @Post('submit') submit(@CurrentUser() user: any, @Body() dto: SubmitCodeDto) { return this.coding.submit(user.sub, dto); } }
