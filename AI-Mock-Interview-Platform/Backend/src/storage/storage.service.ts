import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly s3 = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' });
  async upload(buffer: Buffer, meta: { fileName: string; mimeType: string; folder: string }) {
    const key = `${meta.folder}/${randomUUID()}-${meta.fileName}`;
    const bucket = process.env.AWS_S3_BUCKET;
    if (bucket && process.env.AWS_ACCESS_KEY_ID) {
      await this.s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: meta.mimeType }));
    }
    return { key, url: bucket ? `s3://${bucket}/${key}` : `local://${key}` };
  }
}
