import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
@ApiTags('Admin') @ApiBearerAuth() @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles(Role.ADMIN) @Controller('admin')
export class AdminController { constructor(private readonly prisma: PrismaService) {} @Get('users') users() { return this.prisma.user.findMany({ include: { profile: true, subscriptions: true }, take: 100, orderBy: { createdAt: 'desc' } }); } @Get('interviews/live') live() { return this.prisma.interview.findMany({ where: { status: 'LIVE' }, include: { user: true } }); } @Patch('users/:id/promote') promote(@Param('id') id: string) { return this.prisma.user.update({ where: { id }, data: { role: Role.ADMIN } }); } @Get('subscriptions') subscriptions() { return this.prisma.subscription.findMany({ include: { user: true, plan: true }, take: 100 }); } }
