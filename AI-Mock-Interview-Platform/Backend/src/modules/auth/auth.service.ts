import { Injectable, UnauthorizedException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import * as dayjs from 'dayjs';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../notifications/email.service';
import { LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto, req: any) {
   if (!dto.email.toLowerCase().endsWith('@gmail.com')) {
    throw new ForbiddenException('Only Gmail addresses are allowed to register');
   }

   const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
   if (exists) throw new ConflictException('Email already registered');

   const user = await this.prisma.user.create({
    data: {
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, 12),
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      profile: { create: { fullName: dto.fullName, targetCompanies: [] } },
    },
   });
   this.logger.log(`User created: ${user.id}`);

   return await this.issueTokens(user, req);
  }

  async login(dto: LoginDto, req: any) {
    if (!dto.email.toLowerCase().endsWith('@gmail.com')) {
      throw new ForbiddenException('Only Gmail addresses are allowed');
    }

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Please verify your email address before logging in. Check your inbox for the verification link.');
    }

    return await this.issueTokens(user, req);
  }

  async refresh(refreshToken: string, req: any) {
    const payload = await this.jwt.verifyAsync(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
    const session = await this.prisma.session.findFirst({ where: { userId: payload.sub, revokedAt: null } });
    if (!session || !(await bcrypt.compare(refreshToken, session.refreshHash))) throw new UnauthorizedException('Invalid refresh token');
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
    if (!user.isEmailVerified) {
      throw new ForbiddenException('Please verify your email address before logging in.');
    }
    await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return await this.issueTokens(user, req);
  }

  async logout(userId: string, refreshToken: string) {
    const sessions = await this.prisma.session.findMany({ where: { userId, revokedAt: null } });
    for (const session of sessions) {
      if (await bcrypt.compare(refreshToken, session.refreshHash)) {
        await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
      }
    }
    return { ok: true };
  }

  async verifyEmail(token: string) {
    const tokenHash = this.hash(token);
    const record = await this.prisma.emailVerificationToken.findFirst({ where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } } });
    if (!record) throw new UnauthorizedException('Invalid token');
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { isEmailVerified: true, emailVerifiedAt: new Date() } }),
      this.prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);
    return { ok: true };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      const plainToken = randomBytes(32).toString('hex');
      await this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: this.hash(plainToken), expiresAt: dayjs().add(30, 'minutes').toDate() },
      });
      try {
        await this.emailService.sendPasswordResetEmail(user.email, plainToken);
      } catch (e) {
        this.logger.error(`Failed to send password reset email: ${(e as Error).message}`, (e as Error).stack);
      }
    }
    return { ok: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.passwordResetToken.findFirst({ where: { tokenHash: this.hash(dto.token), usedAt: null, expiresAt: { gt: new Date() } } });
    if (!record) throw new UnauthorizedException('Invalid token');
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await bcrypt.hash(dto.password, 12) } }),
      this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);
    return { ok: true };
  }

  private async issueTokens(user: { id: string; email: string; role: string }, req: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_TTL ?? '15m',
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_TTL ?? '30d',
    });

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshHash: await bcrypt.hash(refreshToken, 12),
        ipAddress: req?.ip ?? '127.0.0.1',
        userAgent: req?.headers?.['user-agent'] ?? '',
        deviceId: req?.headers?.['x-device-id'] ?? null,
        expiresAt: dayjs().add(30, 'days').toDate(),
      },
    });

    return { accessToken, refreshToken, user: payload };
  }

  private async createEmailVerification(userId: string, email: string) {
    const plainToken = randomBytes(32).toString('hex');
    await this.prisma.emailVerificationToken.create({
      data: { userId, tokenHash: this.hash(plainToken), expiresAt: dayjs().add(24, 'hours').toDate() },
    });
    try {
      await this.emailService.sendVerificationEmail(email, plainToken);
    } catch (e) {
      this.logger.error(`Failed to send verification email: ${(e as Error).message}`, (e as Error).stack);
    }
  }

  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
}
