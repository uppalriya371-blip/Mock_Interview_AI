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

  // 🚨 FULLY ROBUST CORS CONFIGURATION FOR MOBILE & CLOUD BLOCKS 🚨
  app.enableCors({
    origin: [
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      'enter you vercel url here of frontend', // Your Vercel frontend url here
      
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, Bypass-Tunnel-Reminder',
    credentials: true,
  });

  // UPDATED: Relax CSP configurations slightly to allow Socket.io CDN and inline scripting elements
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdn.socket.io"],
        },
      },
    }),
  );
  
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

  const port = Number(process.env.PORT ?? 7860);
  await app.listen(port, '0.0.0.0');
  console.log(`\n✅ Cloud Backend running on port ${port}`);
  
 }
bootstrap()
