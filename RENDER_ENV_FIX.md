# 🚨 ACTION REQUIRED: Restore Environment Variables in Render

Your deployment is failing because critical environment variables were removed or not set in Render.

## 1. Go to Render Dashboard
1. Open your [Render Dashboard](https://dashboard.render.com/)
2. Click on your Web Service (`cafeteria-burger-backend`)
3. Click on the **"Environment"** tab on the left sidebar.

## 2. Add Missing Variables
Click **"Add Environment Variable"** for each of the following:

| Key | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | *(Paste your actual Internal connection string)* | Look for your Postgres service in Render dashboard -> "Connect" -> "Internal Connection String". It looks like `postgres://user:pass@host/db` |
| `JWT_SECRET` | `generate_a_secure_random_string_here` | You can type a long random string or generate one using `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | `generate_another_secure_string_here` | **Must be different** from `JWT_SECRET`. |

> [!TIP]
> **Redis URL**: Render usually auto-injects `REDIS_URL` if you linked the Redis service. If not, you might need to add it manually too, but start with the 3 above first.

## 3. Save and Deploy
1. Click **"Save Changes"**.
2. Render might auto-deploy. If not, go to the top right and click **"Manual Deploy"** -> **"Deploy latest commit"**.

---
**Why did this happen?** 
Sometimes changing deployment settings or "Blueprints" can reset environment variables if they aren't explicitly defined in `render.yaml` with a value (which we avoid for secrets).
