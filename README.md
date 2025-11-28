# Cafeteria Burger Backend

A comprehensive NestJS backend for a cafeteria-style burger ordering system with real-time features, scheduled orders, chat functionality, payment processing, and delivery integration.

## Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **Cache/PubSub**: Redis
- **Job Queue**: BullMQ
- **Real-time**: Socket.io with Redis adapter
- **Authentication**: JWT (Passport.js)
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer
- **Deployment**: Docker, Render.com compatible

## Features

- ✅ **User Authentication**: JWT-based auth for customers and staff (admin, kitchen, courier roles)
- ✅ **Menu Management**: Categories, items, modifiers with image upload
- ✅ **Order System**: Instant and scheduled orders with BullMQ
- ✅ **Real-time Updates**: WebSocket events for order status and chat
- ✅ **Chat System**: Real-time customer ↔ staff chat
- ✅ **Payment Processing**: Stripe/Adyen integration (placeholder structure)
- ✅ **Glovo Integration**: Delivery integration (mock implementation)
- ✅ **Internal Delivery**: Courier assignment and tracking
- ✅ **Admin Panel**: Order management, analytics, user management
- ✅ **Scheduled Orders**: BullMQ workers for delayed order processing
- ✅ **Health Checks**: Database and Redis monitoring

## Project Structure

```
src/
├── main.ts                    # Application bootstrap
├── app.module.ts              # Root module
├── modules/
│   ├── auth/                 # Authentication (JWT)
│   ├── users/                # Customer profiles & addresses
│   ├── staff/                # Staff management
│   ├── menu/                 # Menu CRUD
│   ├── orders/               # Order management
│   ├── payments/             # Payment processing
│   ├── chat/                 # Chat system
│   ├── glovo/                # Glovo integration
│   ├── admin/                # Admin panel APIs
│   ├── delivery/             # Internal delivery
│   └── notifications/         # WebSocket event emitter
├── common/                   # Guards, decorators, interceptors, filters
├── database/                 # Prisma service
├── websockets/               # Socket.io gateways
├── queues/                   # BullMQ processors
├── health/                   # Health check endpoints
└── config/                   # Configuration
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd cafeteria-burger-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT tokens
- `REDIS_HOST`, `REDIS_PORT`: Redis connection details
- `FRONTEND_URL`: Frontend URL for CORS

### 4. Set up database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

### 5. Start services with Docker Compose

```bash
docker-compose up -d
```

This will start PostgreSQL and Redis containers.

### 6. Run the application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api`
Swagger documentation: `http://localhost:3000/api/docs`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/staff/login` - Staff login
- `POST /api/auth/refresh` - Refresh token

### Menu (Public)
- `GET /api/menu/categories` - Get all categories
- `GET /api/menu/items` - Get all items
- `GET /api/menu/items/:id` - Get item details

### Menu (Admin)
- `POST /api/menu/categories` - Create category
- `POST /api/menu/items` - Create item
- `POST /api/menu/items/upload-image` - Upload item image
- `PUT /api/menu/items/:id` - Update item
- `DELETE /api/menu/items/:id` - Delete item

### Orders
- `POST /api/orders` - Create order (instant or scheduled)
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/cancel` - Cancel order

### Orders (Admin/Kitchen)
- `GET /api/orders/admin/all` - Get all orders
- `PATCH /api/orders/:id/status` - Update order status

### Chat
- `GET /api/chat/:orderId` - Get chat history
- `POST /api/chat/:orderId` - Send message

### Payments
- `POST /api/payments/intent` - Create payment intent
- `POST /api/payments/webhooks/stripe` - Stripe webhook
- `POST /api/payments/webhooks/adyen` - Adyen webhook

### Admin
- `GET /api/admin/analytics/daily-sales` - Get analytics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/chat/:orderId` - Get chat history

### Delivery
- `POST /api/delivery/tasks/:orderId` - Create delivery task
- `PATCH /api/delivery/tasks/:orderId/assign` - Assign courier
- `GET /api/delivery/tasks/my` - Get courier tasks

### Health
- `GET /api/health` - Health check
- `GET /api/health/db` - Database health
- `GET /api/health/redis` - Redis health

## WebSocket Events

### Order Events (namespace: `/orders`)
- `join_order_room` - Join order room
- `order_created` - Order created
- `order_updated` - Order status updated
- `order_cancelled` - Order cancelled
- `order_ready` - Order ready
- `order_delivering` - Order being delivered
- `order_completed` - Order completed

### Chat Events (namespace: `/chat`)
- `join_chat_room` - Join chat room
- `send_chat_message` - Send message
- `request_chat_history` - Request chat history
- `chat_message` - New message received
- `chat_history` - Chat history response

## Database Schema

Key tables:
- `users` - Customer accounts
- `staff` - Staff members (admin, kitchen, courier)
- `menu_categories` - Menu categories
- `menu_items` - Menu items
- `menu_modifiers` - Item modifiers
- `orders` - Orders
- `order_items` - Order items
- `order_item_modifiers` - Order item modifiers
- `payments` - Payment records
- `chats` - Chat messages
- `glovo_orders` - Glovo delivery orders
- `delivery_tasks` - Internal delivery tasks
- `addresses` - User delivery addresses
- `order_status_history` - Order status audit trail

## BullMQ Queues

- `scheduledOrders` - Processes scheduled orders at exact time
- `notifications` - Handles async notifications (email/SMS)
- `glovoSync` - Syncs Glovo order status

## Development

### Running tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Code formatting

```bash
npm run format
npm run lint
```

### Database migrations

```bash
# Create migration
npm run prisma:migrate

# Reset database (dev only)
npx prisma migrate reset
```

## Deployment

### Docker

```bash
# Build image
docker build -t cafeteria-burger-backend .

# Run container
docker run -p 3000:3000 --env-file .env cafeteria-burger-backend
```

### Render.com

1. Connect your repository
2. Set build command: `npm install && npm run prisma:generate && npm run build`
3. Set start command: `npm run start:prod`
4. Add environment variables
5. Add PostgreSQL and Redis services
6. Run migrations: `npx prisma migrate deploy`

## Environment Variables

See `.env.example` for all required variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - JWT signing secret
- `REDIS_HOST`, `REDIS_PORT` - Redis connection
- `FRONTEND_URL` - CORS origin
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` - Stripe (placeholder)
- `GLOVO_API_KEY`, `GLOVO_API_SECRET` - Glovo (placeholder)

## Integration Notes

### Payment Providers

The payment module has placeholder implementations. To integrate:

1. **Stripe**: Install `stripe` package and implement in `payments.service.ts`
2. **Adyen**: Install Adyen SDK and implement in `payments.service.ts`
3. Update webhook signature verification
4. Test webhook endpoints

### Glovo Integration

The Glovo service is currently mocked. To integrate:

1. Get Glovo API credentials
2. Implement API calls in `glovo.service.ts`
3. Set up webhook signature verification
4. Map Glovo statuses to internal order statuses

## Security

- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Input validation with class-validator
- SQL injection prevention (Prisma)
- Webhook signature verification (to be implemented)
- Rate limiting with @nestjs/throttler
- Helmet for security headers
- CORS configuration

## Monitoring

- Health check endpoints: `/api/health`, `/api/health/db`, `/api/health/redis`
- Request/response logging
- Error tracking
- BullMQ queue monitoring

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
