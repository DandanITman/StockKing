import { testConnection } from './database/connection.js';

// Test database connection
const testDB = async () => {
  console.log('Testing database connection...');
  const connected = await testConnection();
  if (connected) {
    console.log('✅ Database connection successful!');
    process.exit(0);
  } else {
    console.log('❌ Database connection failed!');
    process.exit(1);
  }
};

testDB();
