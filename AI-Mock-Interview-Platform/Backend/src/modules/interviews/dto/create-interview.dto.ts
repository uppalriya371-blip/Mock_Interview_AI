import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Difficulty, InterviewType } from '@prisma/client';
export class CreateInterviewDto { @IsString() title!: string; @IsEnum(InterviewType) type!: InterviewType; @IsOptional() @IsEnum(Difficulty) difficulty?: Difficulty; @IsOptional() @IsString() resumeId?: string; @IsOptional() @IsString() companyId?: string; @IsOptional() @IsString() language?: string; }
