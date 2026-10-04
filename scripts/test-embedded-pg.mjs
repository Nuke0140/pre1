import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import pg from 'pg';

async function main() {
  console.log('[pg] Initializing embedded Postgres on Windows...');
  const dbPath = path.resolve('db/pgdata_win');
  const pgInstance = new EmbeddedPostgres({
    databaseDir: dbPath,
    port: 54329,
    user: 'postgres',
    password: 'postgresPassword',
    persistent: true,
  });

  try {
    await pgInstance.initialise();
    console.log('[pg] Initialized.');
  } catch (err) {
    console.log('[pg] Already initialized or error:', err.message);
  }

  console.log('[pg] Starting Postgres server on port 54329...');
  await pgInstance.start();
  console.log('[pg] Server started successfully!');

  // Ensure role preone and database preone
  const adminClient = new pg.Client({
    connectionString: 'postgresql://postgres:postgresPassword@127.0.0.1:54329/postgres'
  });
  await adminClient.connect();
  console.log('[pg] Connected to admin postgres DB.');

  const roleRes = await adminClient.query(`SELECT 1 FROM pg_roles WHERE rolname='preone'`);
  if (roleRes.rowCount === 0) {
    await adminClient.query(`CREATE ROLE preone LOGIN PASSWORD 'preone' CREATEDB SUPERUSER;`);
    console.log('[pg] Role preone created.');
  } else {
    await adminClient.query(`ALTER ROLE preone WITH LOGIN PASSWORD 'preone' CREATEDB SUPERUSER;`);
    console.log('[pg] Role preone verified.');
  }

  const dbRes = await adminClient.query(`SELECT 1 FROM pg_database WHERE datname='preone'`);
  if (dbRes.rowCount === 0) {
    await adminClient.query(`CREATE DATABASE preone OWNER preone;`);
    console.log('[pg] Database preone created.');
  } else {
    console.log('[pg] Database preone exists.');
  }
  await adminClient.end();

  // Verify preone connection
  const preoneClient = new pg.Client({
    connectionString: 'postgresql://preone:preone@127.0.0.1:54329/preone'
  });
  await preoneClient.connect();
  console.log('[pg] Connected successfully to preone DB!');
  await preoneClient.end();
}

main().catch(err => {
  console.error('[pg] Error starting embedded Postgres:', err);
  process.exit(1);
});
