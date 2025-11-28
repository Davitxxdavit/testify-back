export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || 'api',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  redis: {
    // Parse REDIS_URL if provided (Render.com format: redis://hostname:6379 or redis://:password@hostname:6379)
    ...(process.env.REDIS_URL
      ? (() => {
          try {
            const url = new URL(process.env.REDIS_URL.replace('redis://', 'http://'));
            return {
              host: url.hostname || 'localhost',
              port: parseInt(url.port, 10) || 6379,
              password: url.password || process.env.REDIS_PASSWORD || undefined,
              db: parseInt(url.searchParams.get('db') || process.env.REDIS_DB || '0', 10),
              url: process.env.REDIS_URL,
            };
          } catch {
            // Fallback if URL parsing fails
            return {
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT, 10) || 6379,
              password: process.env.REDIS_PASSWORD,
              db: parseInt(process.env.REDIS_DB, 10) || 0,
              url: process.env.REDIS_URL,
            };
          }
        })()
      : {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT, 10) || 6379,
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB, 10) || 0,
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        }),
  },
  upload: {
    dest: process.env.UPLOAD_DEST || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880,
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
  },
  payments: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    adyen: {
      apiKey: process.env.ADYEN_API_KEY,
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
    },
  },
  glovo: {
    apiKey: process.env.GLOVO_API_KEY,
    apiSecret: process.env.GLOVO_API_SECRET,
    webhookSecret: process.env.GLOVO_WEBHOOK_SECRET,
    baseUrl: process.env.GLOVO_BASE_URL || 'https://api.glovoapp.com',
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },
});

