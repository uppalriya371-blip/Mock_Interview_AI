# InterviewAI — AI Mock Interview Platform

An AI-powered mock interview platform: practice technical, behavioral, and HR
interviews with a real AI interviewer, get AI-scored feedback reports, upload
your resume for tailored questions, and practice coding problems — all in a
single-page frontend backed by a NestJS API. 

---

## 1. How It Works

```
┌─────────────────┐         HTTPS / WebSocket          ┌──────────────────────┐
│   Frontend       │ ───────────────────────────────▶  │   Backend             │
│   webapp.html     │ ◀───────────────────────────────  │   NestJS + Socket.IO  │
│   (Vercel)        │                                    │   (Hugging Face)      │
└─────────────────┘                                    └───────────┬───────────┘
                                                                     │
                                                                     │ Prisma (SQL)
                                                                     ▼
                                                          ┌──────────────────────┐
                                                          │   PostgreSQL          │
                                                          │   (Neon)              │
                                                          └──────────────────────┘
                                                                     │
                                                          AI calls (chat/feedback)
                                                                     ▼
                                                          ┌──────────────────────┐
                                                          │  Groq / OpenAI /      │
                                                          │  Gemini (your key)    │
                                                          └──────────────────────┘
```

- **Frontend** (`webapp.html`) — a single static HTML file. No build step.
  Hosted on **Vercel**. It talks to the backend over plain HTTPS (`fetch`)
  for everything except the live interview room, which uses a **Socket.IO**
  WebSocket connection for real-time AI Q&A.
- **Backend** (`Backend/` — NestJS) — handles auth, interviews, resumes,
  coding problems, feedback generation, and the AI gateway. Packaged as a
  **Docker** container and hosted on a **Hugging Face Space**.
- **Database** — PostgreSQL hosted on **Neon** (serverless Postgres). Prisma
  is the ORM; the schema lives in `prisma/schema.prisma`.
- **AI provider** — the backend calls **Groq** first (fast, generous free
  tier), then falls back to OpenAI, then Gemini, if configured. Used for:
  generating interview questions, scoring your answers, parsing resumes, and
  the Prep Hub chat coach.

Nothing in the app is hardcoded demo data — stats, reports, and interview
content are all generated from your real account and real AI calls.

---

## 2. One-Time Setup — What To Paste Where

There are **three places** you need to manually connect once both services
are deployed for the first time, because the frontend and backend need to
know each other's live URLs.

### Step A — Deploy the backend first, get its URL

1. Push the `Backend/` folder to a **Hugging Face Space** (Docker SDK).
2. Once it builds, your Space gets a public URL that looks like:
   ```
   https://<your-username>-<space-name>.hf.space
   ```
   You'll see this at the top of your Space page.

### Step B — Paste the backend URL into the frontend

Open **`webapp.html`**, find **line 1853**:

```js
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:4000'
  : 'PASTE_YOUR_HUGGING_FACE_URL_HERE'; // <-- Paste your Hugging Face Space URL here
```

Replace the URL on **line 1853** with **your own** Hugging Face Space URL
from Step A. Save the file.

### Step C — Deploy the frontend, get its URL

Push `webapp.html` (or the `Frontend/` folder) to **Vercel**. Once deployed,
you'll get a URL like:

```
https://your-project-name.vercel.app
```

### Step D — Paste the frontend URL into the backend's CORS list

Open **`Backend/src/main.ts`**, find **line 20** inside the `enableCors`
block:

```ts
app.enableCors({
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'PASTE_YOUR_VERCEL_URL_HERE', // <-- Replace with YOUR Vercel URL
    'PASTE_ANY_OTHER_FRONTEND_URL_HERE' // <-- optional: tunnels, staging URLs, etc.
  ],
  ...
```

Replace the URL on **line 20** with your own Vercel URL from Step C. This is
required — without it, the browser will block every request from your
frontend with a CORS error.

> After editing `main.ts`, you need to **re-deploy the backend** (push the
> change to your Hugging Face Space) for it to take effect.

### Step E — Redeploy both

- Push the updated `Backend/` (with the new `main.ts`) to Hugging Face again.
- Push the updated `webapp.html` to Vercel again.

After both redeploys, the frontend and backend can talk to each other.

---

## 3. Database — Neon PostgreSQL

### Getting your Neon connection string

1. Go to **https://neon.tech** and sign up / log in (free tier is enough).
2. Click **New Project**, give it any name, choose a region close to your
   Hugging Face Space's region if possible.
3. Once created, go to the project's **Dashboard → Connection Details**.
4. Copy the **connection string** — it looks like:
   ```
   postgresql://<user>:<password>@<host>.neon.tech/<dbname>?sslmode=require
   ```
   Make sure `?sslmode=require` is included (Neon requires SSL).

### Where to put it

This connection string becomes the `DATABASE_URL` secret on Hugging Face
(see the secrets table below) — **not** committed to any file in the repo.

The backend reads it via `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### First-time table setup

The Docker container automatically runs `npx prisma db push` on every boot
(see `Dockerfile`'s `CMD`), which creates/syncs all tables in your Neon
database the first time it starts. You don't need to run migrations
manually.

To seed sample coding problems (optional, recommended), run once from your
local machine pointed at the same `DATABASE_URL`:
```bash
DATABASE_URL="<your neon connection string>" npx ts-node prisma/seed-coding-questions.ts
```

---

## 4. Hugging Face Secrets — Full List

Hugging Face Spaces don't use a committed `.env` file. Instead, you add
**Secrets** through the Space's web UI:

**Your Space page → Settings → Variables and secrets → New secret**

Add each of the following as a separate secret:

| Secret name | Required? | Where to get it |
|---|---|---|
| `DATABASE_URL` | ✅ Required | Neon dashboard → Connection Details (see §3 above) |
| `JWT_ACCESS_SECRET` | ✅ Required | Any random string. Generate with:<br>`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | ✅ Required | Same as above — generate a **second**, different random string |
| `GROQ_API_KEY` | Recommended | **https://console.groq.com** → API Keys → Create API Key (free tier, fast) |
| `OPENAI_API_KEY` | Optional fallback | **https://platform.openai.com/api-keys** (paid) |
| `GEMINI_API_KEY` | Optional fallback | **https://aistudio.google.com/apikey** (free tier available) |
| `ELEVENLABS_API_KEY` | Optional | **https://elevenlabs.io** → Profile → API Keys (for future voice features) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` | Optional | AWS Console → IAM (only needed if you wire up S3 file storage) |
| `STRIPE_SECRET_KEY` | Optional | **https://dashboard.stripe.com/apikeys** (only if you enable payments) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Optional | **https://dashboard.razorpay.com** → Settings → API Keys (only if you enable payments) |
| `JWT_ACCESS_TTL` | Optional | Defaults to `15m` if not set |
| `JWT_REFRESH_TTL` | Optional | Defaults to `30d` if not set |
| `PORT` | Already set | Hardcoded to `7860` in the Dockerfile — Hugging Face requires this exact port |

**Minimum to get a fully working app:** `DATABASE_URL`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, and `GROQ_API_KEY`. Everything else is optional and
only powers extra features (payments, voice, cloud file storage).

After adding/changing secrets, your Space will automatically restart and
pick them up — no redeploy needed for secret changes alone.

---

## 5. Getting Your AI Key (Groq — Recommended)

The app is configured to try **Groq first** because it has a generous free
tier and very fast responses.

1. Go to **https://console.groq.com**
2. Sign up / log in
3. Go to **API Keys** in the left sidebar
4. Click **Create API Key**, give it any name, copy the key (starts with
   `gsk_...`)
5. Add it as the `GROQ_API_KEY` secret on your Hugging Face Space (see §4)

If `GROQ_API_KEY` isn't set, the backend automatically falls back to
`OPENAI_API_KEY`, then `GEMINI_API_KEY`. If none are set, AI features
(interview questions, feedback scoring, resume parsing, Prep Hub chat) will
return a clear message telling you to add a key, instead of fake/mock data.

---

## 6. Local Development (without deploying)

If you want to run everything on your own machine first:

```bash
cd Backend
npm install
npx prisma generate

# Point at a local Postgres or a Neon dev branch
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mock_interview"' >> .env
echo 'JWT_ACCESS_SECRET="dev-secret-1"' >> .env
echo 'JWT_REFRESH_SECRET="dev-secret-2"' >> .env
echo 'GROQ_API_KEY="gsk_..."' >> .env

npx prisma db push
npm run start:dev
```

Then open `webapp.html` directly in your browser — it auto-detects
`localhost` and points itself at `http://localhost:4000` automatically (see
§2, Step B — no edit needed for local dev).

---

## 7. Project Structure

```
Backend/
  src/
    main.ts                    ← CORS allowlist (paste Vercel URL here)
    app.module.ts               ← wires all modules together
    ai/
      ai-gateway.service.ts     ← Groq/OpenAI/Gemini calls
      ai.controller.ts          ← POST /ai/chat (Prep Hub coach)
    modules/
      auth/                     ← register, login, JWT
      interviews/
        interviews.gateway.ts   ← WebSocket: live AI interview Q&A
        interviews.service.ts   ← interview CRUD + feedback trigger
      feedback/                 ← AI-generated performance reports
      resumes/                  ← resume upload + AI parsing
      coding/                   ← coding problems + submissions
      users/                    ← profile management
      admin/, analytics/        ← admin-only platform stats
  prisma/
    schema.prisma                ← all database tables
    seed-coding-questions.ts     ← optional: sample coding problems
  Dockerfile                     ← Hugging Face deployment config

webapp.html                      ← entire frontend (single file, no build step)
  Line 1853  ← Hugging Face backend URL goes here
```

---

## 8. Troubleshooting

| Symptom | Likely cause |
|---|---|
| CORS error in browser console | Your Vercel URL isn't in `main.ts` line 20's `origin` array, or you forgot to redeploy the backend after editing it |
| "Failed to fetch" / connection refused | Backend URL in `webapp.html` line 1853 is wrong, or the Hugging Face Space is asleep/still building |
| Login works but `/users/me` returns 401 | `JWT_ACCESS_SECRET` changed between deploys — old tokens are invalidated, just log in again |
| AI gives a "no provider configured" message | No `GROQ_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` secret set on Hugging Face |
| Database connection errors on boot | `DATABASE_URL` secret missing, wrong, or missing `?sslmode=require` for Neon |
| Coding Room has no questions | Run the seed script once against your Neon `DATABASE_URL` (see §3) |

---

## 9. Quick Reference — Exact File/Line Map

| What | File | Line | What to paste |
|---|---|---|---|
| Backend URL | `webapp.html` | 1853 | Your Hugging Face Space URL |
| Frontend URL (CORS) | `Backend/src/main.ts` | 20 | Your Vercel URL |
| Database connection | Hugging Face Secret `DATABASE_URL` | — | Your Neon connection string |
| AI key | Hugging Face Secret `GROQ_API_KEY` | — | Your Groq API key |
| Auth secrets | Hugging Face Secrets `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | — | Any two different random strings |
