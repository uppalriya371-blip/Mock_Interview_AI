import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class PaymentsService { private stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null; private razorpay = process.env.RAZORPAY_KEY_ID ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! }) : null; constructor(private readonly prisma: PrismaService) {} plans() { return this.prisma.subscriptionPlan.findMany({ where: { active: true } }); } async checkout(userId: string, input: { planId: string; provider: 'STRIPE' | 'RAZORPAY' }) { const plan = await this.prisma.subscriptionPlan.findUniqueOrThrow({ where: { id: input.planId } }); return { provider: input.provider, userId, plan, checkoutUrl: null, note: 'Create Stripe Checkout Session or Razorpay order when provider keys are configured.' }; } history(userId: string) { return this.prisma.payment.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }); } }
