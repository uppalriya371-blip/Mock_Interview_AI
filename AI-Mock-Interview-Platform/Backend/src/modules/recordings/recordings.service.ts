import { BadRequestException, Injectable } from '@nestjs/common';
import { RecordingType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { QueueService } from '../../queues/queue.service';
@Injectable()
export class RecordingsService { constructor(private readonly prisma: PrismaService, private readonly storage: StorageService, private readonly queues: QueueService) {} async upload(interviewId: string, file: Express.Multer.File) { if (!file) throw new BadRequestException('Recording file is required'); const uploaded = await this.storage.upload(file.buffer, { fileName: file.originalname, mimeType: file.mimetype, folder: `interviews/${interviewId}/recordings` }); const type = file.mimetype.startsWith('audio') ? RecordingType.AUDIO : RecordingType.VIDEO; const recording = await this.prisma.recording.create({ data: { interviewId, type, storageKey: uploaded.key } }); await this.queues.enqueueMediaAnalysis(recording.id); return recording; } playback(id: string) { return this.prisma.recording.findUniqueOrThrow({ where: { id } }); } }
