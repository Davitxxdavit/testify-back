# Render.com Deployment Guide

This project is **fully ready** for Render.com deployment! 🚀

## Prerequisites

1. Render.com account
2. GitHub repository (push your code to GitHub)
3. Render PostgreSQL database
4. Render Redis instance (optional but recommended)

## Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
# Make sure all changes are committed
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Create Services on Render

#### A. PostgreSQL Database
1. Go to Render Dashboard → **New** → **PostgreSQL**
2. Name: `cafeteria-burger-db` (or your preferred name)
3. Database: `cafeteria_burger`
4. Region: Choose closest to your users
5. Click **Create Database**
6. **Copy the Internal Database URL** (you'll need this)

#### B. Redis Instance (Optional but Recommended)
1. Go to Render Dashboard → **New** → **Redis**
2. Name: `cafeteria-burger-redis`
3. Region: Same as PostgreSQL
4. Click **Create Redis**
5. **Copy the Internal Redis URL**

#### C. Web Service
1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `cafeteria-burger-backend`
   - **Region**: Same as database
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: `/` (root)
   - **Environment**: `Node`
   - **Build Command**: 
     ```bash
     npm install && npm run prisma:generate && npm run build
     ```
   - **Start Command**: 
     ```bash
     npm run start:prod
     ```

### 3. Configure Environment Variables

In your Web Service settings, go to **Environment** and add:

#### Required Variables:
```env
NODE_ENV=production
PORT=10000
API_PREFIX=api
FRONTEND_URL=https://your-frontend-url.com

# Database (use Internal Database URL from Render)
DATABASE_URL=postgresql://user:password@hostname:5432/cafeteria_burger?schema=public

# JWT Secrets (generate secure random strings, min 32 chars)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters-long
JWT_REFRESH_EXPIRES_IN=7d

# Redis (use Internal Redis URL from Render)
REDIS_URL=redis://hostname:6379
# OR if Redis has password:
REDIS_URL=redis://:password@hostname:6379

# File Upload
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=5242880

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

#### Optional Variables:
```env
# Payment Providers (when ready)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
ADYEN_API_KEY=...
ADYEN_MERCHANT_ACCOUNT=...

# Glovo (when ready)
GLOVO_API_KEY=...
GLOVO_API_SECRET=...
GLOVO_WEBHOOK_SECRET=...
GLOVO_BASE_URL=https://api.glovoapp.com

# SMTP (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

### 4. Run Database Migrations

After the first deployment, run migrations:

**Option A: Using Render Shell**
1. Go to your Web Service
2. Click **Shell** tab
3. Run:
   ```bash
   npx prisma migrate deploy
   ```

**Option B: Add to Build Command (Recommended)**
Update your build command to:
```bash
npm install && npm run prisma:generate && npm run build && npx prisma migrate deploy
```

### 5. Deploy

1. Click **Manual Deploy** → **Deploy latest commit**
2. Wait for build to complete
3. Check logs for any errors
4. Test your API: `https://your-service.onrender.com/api/health`

## Important Notes

### Redis Connection
Render provides Redis URLs in format: `redis://hostname:6379` or `redis://:password@hostname:6379`

The project automatically handles this format. If you need to parse it:
- The config reads `REDIS_URL` first
- Falls back to `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` if needed

### Database Migrations
- Use `prisma migrate deploy` in production (not `migrate dev`)
- This applies migrations without creating new ones
- Run migrations after each deployment if schema changes

### File Uploads
- Local file uploads (`./uploads`) work but are **ephemeral** on Render
- For production, consider using:
  - AWS S3
  - Cloudinary
  - Render Disk (persistent storage)

### WebSocket Support
- Render supports WebSockets
- Make sure your frontend connects to the Render URL
- Redis adapter is configured for scaling

### Health Checks
- Render automatically checks `/api/health`
- Ensure health endpoint responds quickly

## Post-Deployment Checklist

- [ ] Database migrations applied
- [ ] Health check endpoint working
- [ ] Swagger docs accessible
- [ ] Test authentication endpoints
- [ ] Test order creation
- [ ] Verify WebSocket connections
- [ ] Check Redis connection
- [ ] Monitor logs for errors

## Troubleshooting

### Build Fails
- Check build logs for errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version (Render uses Node 18+)

### Database Connection Issues
- Verify `DATABASE_URL` uses **Internal Database URL**
- Check database is in same region as web service
- Ensure database is not paused

### Redis Connection Issues
- Verify `REDIS_URL` is set correctly
- Check Redis instance is running
- Use Internal Redis URL for same-region services

### Application Crashes
- Check application logs
- Verify all required environment variables are set
- Ensure migrations have run successfully

## Scaling Considerations

- **Horizontal Scaling**: Enable auto-scaling in Render settings
- **Redis Adapter**: Already configured for WebSocket scaling
- **Database Connection Pooling**: Prisma handles this automatically
- **Queue Workers**: Consider separate worker services for BullMQ

## Cost Optimization

- Use **Free Tier** for development/testing
- **PostgreSQL**: Free tier available (90 days, then $7/month)
- **Redis**: Free tier available (25MB)
- **Web Service**: Free tier available (spins down after 15min inactivity)

For production, consider:
- **Starter Plan**: $7/month (always on)
- **Standard Plans**: Better performance, more resources

## Security Checklist

- [ ] Use strong JWT secrets (32+ characters, random)
- [ ] Enable HTTPS (automatic on Render)
- [ ] Set proper CORS origins
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting
- [ ] Review and restrict admin endpoints
- [ ] Set up webhook signature verification (when integrating payments)

## Support

If you encounter issues:
1. Check Render logs
2. Review application logs
3. Test locally with same environment variables
4. Check Render status page

---

**Your project is Render-ready!** Just follow these steps and you'll be live in minutes. 🎉



