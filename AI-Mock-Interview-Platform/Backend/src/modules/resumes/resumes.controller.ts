import { Controller, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResumesService } from './resumes.service';
@ApiTags('Resumes') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('resumes')
export class ResumesController {
  constructor(private readonly resumes: ResumesService) {}
  @Post('upload') @ApiConsumes('multipart/form-data') @UseInterceptors(FileInterceptor('file')) upload(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) { return this.resumes.upload(user.sub, file); }
  @Get() list(@CurrentUser() user: any) { return this.resumes.list(user.sub); }
  @Post(':id/questions') questions(@CurrentUser() user: any, @Param('id') id: string) { return this.resumes.generateQuestions(user.sub, id); }
}
