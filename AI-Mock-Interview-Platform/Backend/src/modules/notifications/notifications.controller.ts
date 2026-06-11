import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
@ApiTags('Notifications') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('notifications')
export class NotificationsController { constructor(private readonly notifications: NotificationsService) {} @Get() list(@CurrentUser() user: any) { return this.notifications.list(user.sub); } @Post() create(@CurrentUser() user: any, @Body() body: { channel: any; subject?: string; body: string }) { return this.notifications.create(user.sub, body); } }
