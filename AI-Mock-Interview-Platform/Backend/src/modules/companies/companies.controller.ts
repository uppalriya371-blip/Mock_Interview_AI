import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
@ApiTags('Companies') @Controller('companies')
export class CompaniesController { constructor(private readonly prisma: PrismaService) {} @Get() list() { return this.prisma.companyDataset.findMany({ orderBy: { name: 'asc' } }); } @Get(':name') get(@Param('name') name: string) { return this.prisma.companyDataset.findUniqueOrThrow({ where: { name } }); } }
