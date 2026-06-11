import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { QueueService } from '../../queues/queue.service';
@Injectable()
export class NotificationsService { constructor(private readonly prisma: PrismaService, private readonly queues: QueueService) {} list(userId: string) { return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }); } async create(userId: string, input: { channel: NotificationChannel; subject?: string; body: string }) { const notification = await this.prisma.notification.create({ data: { userId, channel: input.channel, subject: input.subject, body: input.body } }); await this.queues.enqueueNotification(notification.id); return notification; } }
