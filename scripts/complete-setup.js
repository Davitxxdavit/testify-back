const { execSync } = require('child_process');
const { Client } = require('pg');
require('dotenv').config({ override: true });

async function setup() {
  console.log('🚀 Starting complete setup...\n');

  // Step 1: Test database connection and create database
  console.log('📦 Step 1: Setting up database...');
  try {
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      throw new Error('DATABASE_URL not found in .env');
    }

    const url = new URL(dbUrl.replace('postgresql://', 'http://'));
    const username = url.username || 'postgres';
    const password = url.password || '';
    const host = url.hostname || 'localhost';
    const port = url.port || 5432;
    const targetDb = url.pathname.split('/')[1]?.split('?')[0] || 'cafeteria_burger';

    console.log(`   Connecting to PostgreSQL at ${host}:${port}...`);
    
    const client = new Client({
      host,
      port,
      user: username,
      password: password || undefined,
      database: 'postgres',
    });

    await client.connect();
    console.log('   ✅ Connected to PostgreSQL!');

    // Create database if it doesn't exist
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDb]
    );
    
    if (dbCheck.rows.length === 0) {
      console.log(`   📦 Creating database '${targetDb}'...`);
      await client.query(`CREATE DATABASE ${targetDb}`);
      console.log(`   ✅ Database '${targetDb}' created!`);
    } else {
      console.log(`   ✅ Database '${targetDb}' already exists`);
    }
    
    await client.end();
  } catch (error) {
    console.error('   ❌ Database setup failed:', error.message);
    console.error('\n💡 Please update DATABASE_URL in .env with correct PostgreSQL credentials');
    process.exit(1);
  }

  // Step 2: Run migrations
  console.log('\n🔄 Step 2: Running database migrations...');
  try {
    execSync('npx prisma migrate dev --name init', { 
      stdio: 'inherit',
      env: process.env
    });
    console.log('   ✅ Migrations completed!');
  } catch (error) {
    console.error('   ❌ Migrations failed!');
    process.exit(1);
  }

  // Step 3: Generate Prisma Client (if needed)
  console.log('\n📦 Step 3: Ensuring Prisma Client is up to date...');
  try {
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      env: process.env
    });
    console.log('   ✅ Prisma Client ready!');
  } catch (error) {
    console.error('   ❌ Prisma Client generation failed!');
    process.exit(1);
  }

  console.log('\n✅ Setup complete!');
  console.log('\n🎉 You can now start the application with:');
  console.log('   npm run start:dev');
  console.log('\n📊 View your database with:');
  console.log('   npm run prisma:studio');
}

setup().catch(console.error);

