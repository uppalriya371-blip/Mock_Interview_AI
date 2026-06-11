# API Surface

## REST

- `POST /api/v1/auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- `POST /auth/email/verify`, `POST /auth/password/forgot`, `POST /auth/password/reset`
- `GET /users/me`, `PATCH /users/me/profile`, `GET /users/me/analytics`
- `POST /resumes/upload`, `GET /resumes`, `POST /resumes/:id/questions`
- `POST /interviews`, `GET /interviews`, `GET /interviews/:id`, `POST /interviews/:id/start`, `POST /interviews/:id/complete`
- `POST /recordings/:interviewId/upload`, `GET /recordings/:id/playback`
- `POST /feedback/:interviewId/generate`, `GET /feedback/:interviewId`
- `GET /coding/questions`, `GET /coding/questions/:slug`, `POST /coding/submit`
- `GET /companies`, `GET /companies/:name`
- `POST /recommendations/study-plan`, `GET /recommendations/study-plan`
- `GET /payments/plans`, `POST /payments/checkout`, `GET /payments/billing-history`
- `GET /analytics/platform`
- `GET /admin/users`, `GET /admin/interviews/live`, `PATCH /admin/users/:id/promote`, `GET /admin/subscriptions`

## WebSocket namespace

`/interviews`

Events:

- `join` with `{ interviewId }`
- `user.message` with `{ interviewId, content }`
- `voice.chunk` with `{ interviewId, sequence, audioBase64 }`
- Server emits `joined`, `transcript.partial`, `ai.message`, and `voice.ack`
