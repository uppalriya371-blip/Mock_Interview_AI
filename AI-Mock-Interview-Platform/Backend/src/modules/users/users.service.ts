import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  me(userId: string) { return this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true, skills: true, resumes: true, subscriptions: { include: { plan: true } } } }); }
  updateProfile(userId: string, dto: UpdateProfileDto) { return this.prisma.userProfile.upsert({ where: { userId }, update: dto, create: { userId, fullName: dto.fullName ?? 'Candidate', targetCompanies: dto.targetCompanies ?? [] } }); }
  analytics(userId: string) { return this.prisma.performanceMetric.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 }); }
}
