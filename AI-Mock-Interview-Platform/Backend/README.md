# Enterprise AI Mock Interview Backend

Production-oriented NestJS backend for an AI-powered mock interview SaaS platform with REST APIs, WebSockets, Prisma/PostgreSQL, Redis, queues, AI provider adapters, payments, analytics, recording storage, and Docker.

## Quick start

```bash
cp .env.example .env
npm install
npx prisma generate
npm run prisma:migrate
npm run seed
npm run start:dev
```

Swagger: `http://localhost:4000/docs`

## Architecture

- `src/modules/*`: bounded business modules for auth, users, resumes, interviews, coding, payments, analytics, admin, notifications, avatar, recordings, feedback, companies, and recommendations.
- `src/ai`: provider-neutral AI gateway with OpenAI/Gemini/STT/TTS/avatar integration seams.
- `src/storage`: S3/GCS-compatible object storage abstraction.
- `src/queues`: BullMQ queues for async resume parsing, media processing, feedback, and notifications.
- `prisma/schema.prisma`: scalable relational model covering users, sessions, devices, resumes, interviews, reports, coding submissions, recordings, billing, notifications, analytics, and company datasets.

## Production notes

Use managed PostgreSQL, managed Redis, object storage, a queue worker deployment, and horizontal API replicas behind a load balancer. For WebSockets, add a Socket.IO Redis adapter and configure sticky sessions or ingress affinity.
