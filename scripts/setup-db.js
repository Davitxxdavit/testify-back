const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
require('dotenv').config();

async function setupDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in .env file');
    process.exit(1);
  }

  console.log('📦 Setting up database...');
  console.log('🔗 Database URL:', dbUrl.replace(/:[^:@]+@/, ':****@')); // Hide password

  try {
    // Try to run migrations (this will create the database if it doesn't exist)
    console.log('\n🔄 Running Prisma migrations...');
    execSync('npx prisma migrate dev --name init', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    console.log('\n✅ Database setup complete!');
    console.log('📊 You can now view your database with: npm run prisma:studio');
    
  } catch (error) {
    console.error('\n❌ Database setup failed!');
    console.error('\n💡 Common issues:');
    console.error('1. PostgreSQL is not running');
    console.error('2. Wrong credentials in DATABASE_URL');
    console.error('3. Database user doesn\'t have CREATE DATABASE permission');
    console.error('\n📝 Update your .env file with correct PostgreSQL credentials:');
    console.error('   DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/cafeteria_burger?schema=public');
    process.exit(1);
  }
}

setupDatabase();


