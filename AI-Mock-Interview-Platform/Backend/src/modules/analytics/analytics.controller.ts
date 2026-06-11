import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
@ApiTags('Analytics') @ApiBearerAuth() @UseGuards(AuthGuard('jwt'), RolesGuard) @Controller('analytics')
export class AnalyticsController { constructor(private readonly prisma: PrismaService) {} @Get('platform') @Roles(Role.ADMIN) async platform() { const [users, interviews, payments] = await Promise.all([this.prisma.user.count(), this.prisma.interview.count(), this.prisma.payment.aggregate({ _sum: { amountCents: true } })]); return { users, interviews, revenueCents: payments._sum.amountCents ?? 0 }; } }
