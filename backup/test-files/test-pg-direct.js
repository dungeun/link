const { Client } = require('pg');

const client = new Client({
  host: 'coolify.one-q.xyz',
  port: 5433,
  database: 'revu_platform',
  user: 'linkpick_user',
  password: 'LinkPick2024!',
  ssl: false
});

async function testConnection() {
  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected successfully!');
    
    const result = await client.query('SELECT current_user, version()');
    console.log('Query result:', result.rows[0]);
    
  } catch (error) {
    console.error('Connection failed:', error.message);
  } finally {
    await client.end();
  }
}

testConnection();