-- Run this SQL script to create a development user
-- Connect to PostgreSQL as superuser first, then run:

CREATE USER cafeteria_dev WITH PASSWORD 'dev123';
ALTER USER cafeteria_dev CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE postgres TO cafeteria_dev;

-- After running this, update your .env file:
-- DATABASE_URL=postgresql://cafeteria_dev:dev123@localhost:5432/cafeteria_burger?schema=public



