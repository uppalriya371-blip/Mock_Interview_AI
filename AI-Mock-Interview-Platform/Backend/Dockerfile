# --- Create a Base with OpenSSL ---
FROM node:20-alpine AS base
# 👇 This single line fixes the Prisma crash
RUN apk add --no-cache openssl

# --- Stage 1: Install Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# --- Stage 2: Build the App & Generate Prisma ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate the database client and build the NestJS app
RUN npx prisma generate && npm run build

# --- Stage 3: Production Runner ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Force the container to use Hugging Face's required port
ENV PORT=7860 

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

# Hugging Face strictly requires exposing 7860
EXPOSE 7860

# Start the built application
CMD ["sh", "-c", "npx prisma db push && node dist/src/main.js"]