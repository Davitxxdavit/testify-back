# Setting Up Redis via WSL

## After Reboot (Required)

Once you reboot your computer, WSL will be ready. Then follow these steps:

### Step 1: Open WSL Terminal
- Press `Win` key
- Type "Ubuntu" and open it
- Or run: `wsl` in PowerShell

### Step 2: Install Redis in WSL
```bash
sudo apt update
sudo apt install redis-server -y
```

### Step 3: Start Redis
```bash
sudo service redis-server start
```

### Step 4: Make Redis Start Automatically
```bash
sudo systemctl enable redis-server
```

### Step 5: Test Redis
```bash
redis-cli ping
# Should return: PONG
```

### Step 6: Verify from Windows
From PowerShell:
```powershell
wsl redis-cli ping
# Should return: PONG
```

## Important Notes

- Redis in WSL runs on `localhost:6379` - your Windows apps can connect to it
- Redis will start automatically when WSL starts
- To start Redis manually: `wsl sudo service redis-server start`
- To stop Redis: `wsl sudo service redis-server stop`

## Alternative: Memurai (Easier, No Reboot Needed)

If you don't want to reboot, install Memurai instead:
1. Download: https://www.memurai.com/get-memurai
2. Install (no reboot needed)
3. It runs as a Windows service automatically


