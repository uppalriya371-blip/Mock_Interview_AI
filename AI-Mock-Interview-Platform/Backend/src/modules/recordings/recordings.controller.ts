import { Controller, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { RecordingsService } from './recordings.service';
@ApiTags('Recordings') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('recordings')
export class RecordingsController { constructor(private readonly recordings: RecordingsService) {} @Post(':interviewId/upload') @ApiConsumes('multipart/form-data') @UseInterceptors(FileInterceptor('file')) upload(@Param('interviewId') interviewId: string, @UploadedFile() file: Express.Multer.File) { return this.recordings.upload(interviewId, file); } @Get(':id/playback') playback(@Param('id') id: string) { return this.recordings.playback(id); } }
