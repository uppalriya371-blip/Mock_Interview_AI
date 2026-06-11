import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
@ApiTags('Payments') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('payments')
export class PaymentsController { constructor(private readonly payments: PaymentsService) {} @Get('plans') plans() { return this.payments.plans(); } @Post('checkout') checkout(@CurrentUser() user: any, @Body() body: { planId: string; provider: 'STRIPE' | 'RAZORPAY' }) { return this.payments.checkout(user.sub, body); } @Get('billing-history') history(@CurrentUser() user: any) { return this.payments.history(user.sub); } }
