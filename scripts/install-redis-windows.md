# Installing Redis on Windows

## Option 1: Using WSL (Windows Subsystem for Linux) - Recommended

1. **Install WSL** (if not already installed):
   ```powershell
   wsl --install
   ```
   Restart your computer when prompted.

2. **Open WSL** and install Redis:
   ```bash
   sudo apt update
   sudo apt install redis-server
   ```

3. **Start Redis**:
   ```bash
   sudo service redis-server start
   ```

4. **Verify it's running**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

5. **Make Redis start automatically**:
   ```bash
   sudo systemctl enable redis-server
   ```

## Option 2: Using Memurai (Windows Native Redis Alternative)

1. Download Memurai from: https://www.memurai.com/get-memurai
2. Install it (it's a Windows service)
3. It runs on port 6379 by default
4. No configuration needed - it works like Redis

## Option 3: Using Docker (if you have Docker Desktop)

1. **Start Redis container**:
   ```bash
   docker run -d -p 6379:6379 --name redis redis:7-alpine
   ```

2. **Verify it's running**:
   ```bash
   docker ps
   ```

3. **Stop Redis** (when needed):
   ```bash
   docker stop redis
   ```

## Option 4: Using Chocolatey (Package Manager)

1. **Install Chocolatey** (if not installed):
   Visit: https://chocolatey.org/install

2. **Install Redis**:
   ```powershell
   choco install redis-64
   ```

3. **Start Redis**:
   ```powershell
   redis-server
   ```

## Quick Test

After installing, test the connection:
```bash
redis-cli ping
```

Should return: `PONG`

## For Your Project

Once Redis is installed and running, your application will automatically connect to it. The error messages will stop.

**Note**: Redis is optional for basic functionality. The app will work without it, but features like:
- Scheduled orders (BullMQ)
- WebSocket scaling
- Caching

...will not work until Redis is running.


