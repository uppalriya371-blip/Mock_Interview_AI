import { IsIn, IsString } from 'class-validator';
export class SubmitCodeDto { @IsString() questionId!: string; @IsIn(['python', 'java', 'cpp', 'javascript', 'go']) language!: string; @IsString() sourceCode!: string; }
