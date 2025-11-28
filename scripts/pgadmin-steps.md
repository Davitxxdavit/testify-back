# Steps to Create Database User in pgAdmin

## Method 1: Using Query Tool (Easiest)

1. **Right-click on "PostgreSQL 18"** (your server name)
2. Select **"Query Tool"** from the menu
3. A query editor will open on the right side
4. **Paste this SQL command:**
   ```sql
   CREATE USER cafeteria_dev WITH PASSWORD 'dev123';
   ALTER USER cafeteria_dev CREATEDB;
   ```
5. Click the **"Execute"** button (or press F5)
6. You should see "Success" message

## Method 2: Using GUI (Alternative)

1. **Expand "Login/Group Roles"** in the left panel
2. **Right-click on "Login/Group Roles"**
3. Select **"Create" → "Login/Group Role..."**
4. In the dialog:
   - **General tab**: Name = `cafeteria_dev`
   - **Definition tab**: Password = `dev123`
   - **Privileges tab**: Check "Can login?" and "Create databases"
5. Click **"Save"**

## After Creating User

Run the setup script:
```bash
node scripts/complete-setup.js
```

