const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in .env');
    return;
  }

  console.log('🔍 Testing database connection...');
  
  // Extract connection details
  const url = new URL(dbUrl.replace('postgresql://', 'http://'));
  const username = url.username;
  const password = url.password;
  const host = url.hostname;
  const port = url.port || 5432;
  const database = url.pathname.split('/')[1]?.split('?')[0] || 'postgres';

  console.log(`   Host: ${host}`);
  console.log(`   Port: ${port}`);
  console.log(`   User: ${username}`);
  console.log(`   Database: ${database}`);
  console.log(`   Password: ${password ? '***' : '(empty)'}`);

  // Try connecting to postgres database first (to create our database)
  const client = new Client({
    host,
    port,
    user: username,
    password: password || undefined,
    database: 'postgres', // Connect to default postgres DB first
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL!');
    
    // Check if our database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [database]
    );
    
    if (result.rows.length === 0) {
      console.log(`\n📦 Creating database '${database}'...`);
      await client.query(`CREATE DATABASE ${database}`);
      console.log(`✅ Database '${database}' created!`);
    } else {
      console.log(`✅ Database '${database}' already exists`);
    }
    
    await client.end();
    return true;
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error(`   Error: ${error.message}`);
    console.error('\n💡 Please check:');
    console.error('   1. PostgreSQL is running');
    console.error('   2. Username and password in DATABASE_URL are correct');
    console.error('   3. User has permission to create databases');
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n✅ Database is ready! You can now run: npm run prisma:migrate');
  } else {
    console.log('\n📝 Update your .env file with correct credentials:');
    console.log('   DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/cafeteria_burger?schema=public');
  }
  process.exit(success ? 0 : 1);
});



