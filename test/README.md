# E2E Tests

Comprehensive end-to-end tests covering all Swagger API endpoints.

## Test Coverage

### ✅ Health Checks
- `GET /api/health`
- `GET /api/health/db`
- `GET /api/health/redis`

### ✅ Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/staff/login` - Staff login
- `POST /api/auth/refresh` - Token refresh

### ✅ Menu (Public & Admin)
- `GET /api/menu/categories` - Get all categories
- `GET /api/menu/categories/:id` - Get category by ID
- `POST /api/menu/categories` - Create category (Admin)
- `PUT /api/menu/categories/:id` - Update category (Admin)
- `DELETE /api/menu/categories/:id` - Delete category (Admin)
- `GET /api/menu/items` - Get all items
- `GET /api/menu/items/:id` - Get item by ID
- `POST /api/menu/items` - Create item (Admin)
- `PUT /api/menu/items/:id` - Update item (Admin)
- `DELETE /api/menu/items/:id` - Delete item (Admin)
- `GET /api/menu/items/:itemId/modifiers` - Get modifiers
- `POST /api/menu/modifiers` - Create modifier (Admin)
- `PUT /api/menu/modifiers/:id` - Update modifier (Admin)
- `DELETE /api/menu/modifiers/:id` - Delete modifier (Admin)

### ✅ Orders
- `POST /api/orders` - Create order (instant & scheduled)
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/admin/all` - Get all orders (Admin)
- `PATCH /api/orders/:id/status` - Update status (Admin)

### ✅ Users
- `GET /api/users/profile` - Get user profile
- `GET /api/users/addresses` - Get addresses
- `POST /api/users/addresses` - Create address
- `PUT /api/users/addresses/:id` - Update address
- `DELETE /api/users/addresses/:id` - Delete address

### ✅ Admin
- `GET /api/admin/analytics/daily-sales` - Get analytics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/chat/:orderId` - Get chat history

### ✅ Chat
- `GET /api/chat/:orderId` - Get chat history
- `POST /api/chat/:orderId` - Send message

## Running Tests

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Tests in Watch Mode
```bash
npm run test:e2e:watch
```

### Run Specific Test File
```bash
npm run test:e2e -- auth.e2e-spec.ts
```

### Run with Coverage
```bash
npm run test:e2e -- --coverage
```

## Test Structure

Each test file follows this pattern:
1. **Setup**: Create test users, staff, and data
2. **Tests**: Test all endpoints for that module
3. **Cleanup**: Remove test data

## Prerequisites

- Database must be running and accessible
- Tests use the same database (consider using a test database)
- Environment variables from `.env` are used

## Test Data

Tests automatically:
- Create test users and staff
- Create test menu items
- Create test orders
- Clean up after tests complete

## Notes

- Tests are isolated and can run in any order
- Each test creates its own data
- Tests clean up after themselves
- Some tests depend on data created in `beforeAll`

## Future Improvements

- [ ] Add tests for delivery endpoints
- [ ] Add tests for payment endpoints
- [ ] Add tests for Glovo endpoints
- [ ] Add tests for staff management
- [ ] Add WebSocket connection tests
- [ ] Add integration tests for scheduled orders



