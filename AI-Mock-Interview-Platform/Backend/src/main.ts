import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const prefix = process.env.API_PREFIX ?? 'api/v1';
  app.setGlobalPrefix(prefix);
  app.enableVersioning({ type: VersioningType.URI });

  // CORS: allow configured FRONTEND_URL + file:// origins in development
  app.enableCors({
    origin: (origin, callback) => {
      const allowed = process.env.FRONTEND_URL?.split(',').map((u) => u.trim()) ?? [];
      const isDev = process.env.NODE_ENV !== 'production';
      // Allow requests with no origin (file://, Postman, Swagger) or matching origin
      if (!origin || allowed.includes(origin) || isDev) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('AI Mock Interview SaaS API')
    .setDescription(
      'Enterprise backend API for real-time AI mock interviews, coding practice, subscriptions, analytics, and admin operations.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`\n✅ Backend running at http://localhost:${port}`);
  console.log(`📚 Swagger docs  at http://localhost:${port}/docs\n`);
}
bootstrap();
