# WebSocket Setup

## Redis Adapter (for scaling)

To enable Redis adapter for Socket.io scaling across multiple instances:

1. Install additional dependency:
```bash
npm install @socket.io/redis-adapter ioredis
```

2. Update `order.gateway.ts` and `chat.gateway.ts`:
```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

// In constructor or after server initialization:
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

this.server.adapter(createAdapter(pubClient, subClient));
```

For now, the basic Socket.io setup works for single-instance deployments.

