# Quick Redis Setup for Windows

## Option 1: Memurai (Recommended - Windows Native)

1. **Download Memurai** (Free for development):
   - Visit: https://www.memurai.com/get-memurai
   - Download the installer
   - Run the installer
   - It will install as a Windows service automatically

2. **Start Memurai**:
   ```powershell
   Start-Service -Name "Memurai"
   ```

3. **Verify**:
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 6379
   ```

## Option 2: Docker (If you have Docker Desktop)

```powershell
# Start Redis container
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Verify it's running
docker ps

# Stop when needed
docker stop redis
```

## Option 3: Continue Without Redis

**Your app works perfectly without Redis!** 

Redis is only needed for:
- ✅ Scheduled orders (BullMQ) - won't work
- ✅ WebSocket scaling - single instance only
- ✅ Advanced caching - basic features still work

For development and testing, you can continue without Redis and add it later when deploying to Render.

## Quick Test After Installation

```powershell
# Test Redis connection
node -e "const Redis = require('ioredis'); const r = new Redis({ host: 'localhost', port: 6379, retryStrategy: () => null }); r.ping().then(() => console.log('✅ Redis connected!')).catch(() => console.log('❌ Redis not accessible'));"
```

## For Render Deployment

When you deploy to Render, Redis will be provided as a service. You don't need to install it locally for production deployment.

