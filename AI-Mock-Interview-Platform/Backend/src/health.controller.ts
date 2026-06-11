import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('Health')
@Controller('health')
export class HealthController { @Get() health() { return { ok: true, service: 'mock-interview-ai-backend', timestamp: new Date().toISOString() }; } }
