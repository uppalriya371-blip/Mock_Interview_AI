# AI Mock Interview Platform — Full Setup & Integration Guide

## What You Have

- **Backend**: NestJS + Prisma + PostgreSQL + Redis + WebSockets (runs on port 4000)
- **Frontend**: Single `webapp.html` file (open directly in browser)
- **Status**: Copilot already connected the frontend API client to the backend. The code is correct — you just need to run the services.

---

## Prerequisites (Install These First)

| Tool | Version | How to check |
|------|---------|--------------|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| PostgreSQL | 14+ | `psql --version` |
| Redis | 6+ | `redis-server --version` |

> **Easiest way**: Use Docker so you don't need to install PostgreSQL/Redis manually.

---

## Option A — Run with Docker (Recommended)

Docker handles PostgreSQL and Redis automatically.

### Step 1 — Start services

```bash
cd Backend
docker-compose up -d postgres redis
```

This starts PostgreSQL on port 5432 and Redis on port 6379.

### Step 2 — Install Node dependencies

```bash
npm install
```

### Step 3 — Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate dev --name init
```

### Step 4 — Start the backend

```bash
npm run start:dev
```

Backend is live at: http://localhost:4000  
Swagger API docs: http://localhost:4000/docs

### Step 5 — Open the frontend

Just open `Frontend/webapp.html` in your browser. No build step needed.

---

## Option B — Run Without Docker (Manual)

### Step 1 — Start PostgreSQL

Make sure PostgreSQL is running and create the database:

```bash
psql -U postgres -c "CREATE DATABASE mock_interview;"
```

### Step 2 — Start Redis

```bash
redis-server
```

### Step 3 — Configure .env

The `.env` file is already set up. Confirm these values match your local setup:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mock_interview?schema=public
REDIS_URL=redis://localhost:6379
PORT=4000
FRONTEND_URL=http://localhost:3000
```

> For the frontend opened as a file (not a server), CORS needs to allow `null` origin.  
> See the CORS fix below.

### Step 4 — Install, migrate, start

```bash
cd Backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

---

## CORS Fix (Required When Opening Frontend as a File)

When you open `Frontend/webapp.html` directly in a browser (not via a server), the browser sends `Origin: null`. The current CORS config only allows the `FRONTEND_URL` value.

**Fix in `Backend/src/main.ts`** — change line:

```typescript
// Current (breaks for file:// origin):
app.enableCors({ origin: process.env.FRONTEND_URL?.split(',') ?? true, credentials: true });

// Replace with:
app.enableCors({
  origin: (origin, callback) => {
    const allowed = process.env.FRONTEND_URL?.split(',') ?? [];
    if (!origin || allowed.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
});
```

This allows requests from `file://` during development without opening CORS to everyone in production.

---

## JWT Secret Fix (Required)

The `.env` file has placeholder JWT secrets. **The app won't work with them** — login will succeed but tokens may conflict across restarts. Replace with real random values:

```env
# Replace these in Backend/.env:
JWT_ACCESS_SECRET=replace-with-strong-access-secret
JWT_REFRESH_SECRET=replace-with-strong-refresh-secret

# With values like (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_ACCESS_SECRET=a3f9c2d1e8b7f4a6c3d2e1f0b9a8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0
JWT_REFRESH_SECRET=b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2
```

Generate them:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Run twice — once for ACCESS, once for REFRESH
```

---

## Verifying Everything Works

### 1. Check backend health

Visit: http://localhost:4000/api/v1/health  
You should see: `{ "status": "ok" }`

### 2. Check Swagger docs

Visit: http://localhost:4000/docs  
You can test all endpoints here.

### 3. Test login from frontend

1. Open `Frontend/webapp.html` in browser
2. Click "Get Started Free"
3. Register with any email/password
4. You should land on the dashboard

### 4. Check browser console

Press F12 → Console. You should NOT see:
- `CORS error` → means CORS fix above wasn't applied
- `net::ERR_CONNECTION_REFUSED` → backend isn't running
- `401 Unauthorized` (on first load) → JWT secrets might be wrong

---

## Optional API Keys

The app works without these, but features will be mocked:

| Feature | Key needed | Where in .env |
|---------|-----------|----------------|
| AI questions/feedback | `OPENAI_API_KEY` or `GEMINI_API_KEY` | Already in .env |
| Resume parsing (AI) | same as above | — |
| Text-to-speech | `ELEVENLABS_API_KEY` | Already in .env |
| Avatar sessions | `TAVUS_API_KEY` or `HEYGEN_API_KEY` | Already in .env |
| Resume/recording storage | `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` | Already in .env |
| Payments | `STRIPE_SECRET_KEY` or `RAZORPAY_KEY_ID` | Already in .env |

Without these keys the app still runs — it just returns mock/placeholder data for AI features.

---

## Project Structure

```
Backend/
  src/
    main.ts               ← Entry point, CORS, Swagger
    app.module.ts         ← All modules wired together
    modules/
      auth/               ← Login, register, JWT
      users/              ← Profile management
      interviews/         ← Interview CRUD + WebSocket gateway
      resumes/            ← Upload + AI parsing
      feedback/           ← AI feedback generation
      coding/             ← Coding challenges + submission
      companies/          ← Company list
      payments/           ← Stripe / Razorpay
      analytics/          ← Platform stats
      admin/              ← Admin-only endpoints
      notifications/      ← Email/push
      recordings/         ← Audio/video storage
      avatar/             ← TTS + avatar sessions
      recommendations/    ← Study plans
    ai/
      ai-gateway.service.ts ← Wraps OpenAI/Gemini (mock if no key)
    database/
      prisma.service.ts   ← Database connection
    storage/
      storage.service.ts  ← S3 uploads (local fallback)
    queues/
      queue.service.ts    ← BullMQ background jobs
  prisma/
    schema.prisma         ← All database models

Frontend/
  webapp.html             ← Complete SPA (all-in-one HTML)
```

---

## Common Errors & Fixes

### `Cannot find module '@prisma/client'`
```bash
npx prisma generate
```

### `P1001: Can't reach database server`
- PostgreSQL isn't running, or wrong DATABASE_URL in .env
- Run: `docker-compose up -d postgres`

### `ECONNREFUSED redis`
- Redis isn't running
- Run: `docker-compose up -d redis` or `redis-server`

### `Access-Control-Allow-Origin` errors in browser
- Apply the CORS fix in main.ts described above

### `Error: The JWT is not valid` / auth loop
- Your JWT secrets in `.env` are still the placeholder strings
- Generate real secrets as shown above

### `npm run start:dev` fails with TypeScript errors
```bash
npm run build
# If build succeeds, TypeScript config is fine
# If build fails, note the error and check the specific file
```

---

## WebSocket (Real-Time Interview Room)

The interview room connects via Socket.IO to `http://localhost:4000`.

The backend gateway (`interviews.gateway.ts`) handles:
- `join` → user joins interview room
- `user.message` → user sends answer
- `voice.chunk` → audio streaming
- Server emits `ai.message`, `transcript.partial`, `joined`, `voice.ack`

If WebSocket doesn't connect:
1. Confirm backend is running
2. Check browser console for socket errors
3. The socket connects with `auth: { token }` — confirm you're logged in first

---

## What Copilot Did (Summary)

Copilot added to `webapp.html`:
1. `APIClient` class — centralized fetch wrapper with auth headers
2. Auth flow — `handleAuthSubmit()` calls register/login, stores token in localStorage
3. Dashboard loader — fetches real interviews and analytics on login
4. Interview creation — `startInterview()` + WebSocket setup via `setupInterviewSocket()`
5. Resume upload — `handleResumeUpload()` sends file to `/resumes/upload`

The integration is **correct**. The only things needed to run it are proper environment setup (PostgreSQL, Redis, Prisma migration) and the two small fixes (CORS + JWT secrets).
