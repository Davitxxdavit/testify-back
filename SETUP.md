# Setup Instructions

## Step 1: Install Dependencies ✅
```bash
npm install
```
**Status: COMPLETED**

## Step 2: Create .env File

Create a `.env` file in the root directory with the following content:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api
FRONTEND_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cafeteria_burger?schema=public

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# BullMQ
REDIS_URL=redis://localhost:6379

# File Upload
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=5242880

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Payment Providers (Placeholder)
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
ADYEN_API_KEY=placeholder
ADYEN_MERCHANT_ACCOUNT=placeholder

# Glovo (Mock)
GLOVO_API_KEY=placeholder
GLOVO_API_SECRET=placeholder
GLOVO_WEBHOOK_SECRET=placeholder
GLOVO_BASE_URL=https://api.glovoapp.com

# SMTP (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

**Note:** Update `DATABASE_URL` with your PostgreSQL credentials, and `JWT_SECRET`/`JWT_REFRESH_SECRET` with secure random strings (minimum 32 characters).

## Step 3: Start Database and Redis

### Option A: Using Docker Compose (Recommended)
```bash
docker compose up -d
```

### Option B: Manual Setup
- Install and start PostgreSQL on port 5432
- Install and start Redis on port 6379
- Create database: `cafeteria_burger`

## Step 4: Run Database Migrations

```bash
# Generate Prisma Client (already done)
npm run prisma:generate

# Create and run migrations
npm run prisma:migrate
```

## Step 5: Start the Application

```bash
npm run start:dev
```

The API will be available at:
- API: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/api/health

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env file
- Verify database `cafeteria_burger` exists

### Redis Connection Issues
- Ensure Redis is running
- Check REDIS_HOST and REDIS_PORT in .env file

### Port Already in Use
- Change PORT in .env file
- Or stop the service using port 3000


