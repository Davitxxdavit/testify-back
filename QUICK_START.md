# Quick Start Guide

## Step 1: Set Up PostgreSQL User

Open **pgAdmin** (or any PostgreSQL client) and run:

```sql
CREATE USER cafeteria_dev WITH PASSWORD 'dev123';
ALTER USER cafeteria_dev CREATEDB;
```

**Alternative:** If you prefer to use the `postgres` user, set its password to `postgres` in pgAdmin:
- Right-click on `postgres` user → Properties → Definition
- Set password to: `postgres`
- Then update `.env`: `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cafeteria_burger?schema=public`

## Step 2: Run Complete Setup

```bash
node scripts/complete-setup.js
```

This will:
- ✅ Create the database
- ✅ Run all migrations
- ✅ Set up Prisma Client

## Step 3: Start the Application

```bash
npm run start:dev
```

The API will be available at:
- **API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health

## Troubleshooting

### PostgreSQL Connection Issues
- Make sure PostgreSQL service is running
- Check if you can connect via pgAdmin
- Verify the username/password in `.env`

### Redis Connection Issues
- Make sure Redis is running (if using Redis features)
- For local dev, Redis is optional for basic functionality

### Port Already in Use
- Change `PORT` in `.env` file
- Or stop the service using port 3000

## For Render.com Deployment Later

When deploying to Render:
1. Create PostgreSQL database on Render
2. Get the connection string from Render
3. Update `DATABASE_URL` in Render environment variables
4. Run migrations: `npx prisma migrate deploy`

