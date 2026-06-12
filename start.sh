#!/bin/bash
# =====================================================
# AI Mock Interview Platform - Quick Start Script
# Run this from the project root (where Backend/ lives)
# =====================================================

set -e

echo ""
echo "🚀 AI Mock Interview Platform - Setup"
echo "======================================"

# Step 1: Generate JWT secrets if they are still placeholders
if grep -q "replace-with-strong" Backend/.env 2>/dev/null; then
  echo ""
  echo "🔑 Generating JWT secrets..."
  ACCESS_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

  # Replace on Mac (BSD sed) and Linux (GNU sed)
  sed -i.bak "s/replace-with-strong-access-secret/$ACCESS_SECRET/" Backend/.env
  sed -i.bak "s/replace-with-strong-refresh-secret/$REFRESH_SECRET/" Backend/.env
  rm -f Backend/.env.bak
  echo "   ✅ JWT secrets generated"
fi

# Step 2: Start Docker services
echo ""
echo "🐳 Starting PostgreSQL and Redis via Docker..."
cd Backend
docker-compose up -d postgres redis
echo "   ✅ Database services starting (waiting 5s)..."
sleep 5

# Step 3: Install npm packages
echo ""
echo "📦 Installing npm packages..."
npm install
echo "   ✅ Packages installed"

# Step 4: Prisma
echo ""
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma migrate dev --name init
echo "   ✅ Database ready"

# Step 5: Start backend
echo ""
echo "🟢 Starting backend server..."
echo "   Backend → http://localhost:4000"
echo "   Swagger → http://localhost:4000/docs"
echo ""
echo "   Open Frontend/webapp.html in your browser to use the app."
echo ""
npm run start:dev
