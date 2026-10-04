import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import pg from 'pg';

export async function ensurePostgresRunning() {
  // 1. Check if already accepting TCP connections on 54329
  const testClient = new pg.Client({
    connectionString: 'postgresql://preone:preone@127.0.0.1:54329/preone'
  });
  try {
    await testClient.connect();
    const res = await testClient.query('SELECT count(*)::int as count FROM "students"');
    console.log(`[pg] PostgreSQL already running on port 54329 (${res.rows[0].count} students found)`);
    await testClient.end();
    return;
  } catch (e) {
    console.log('[pg] PostgreSQL port 54329 not responding, starting embedded instance...');
  }

  // 2. Start embedded postgres
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
  } catch (err) {
    // Ignore already initialized error
  }

  await pgInstance.start();
  console.log('[pg] Embedded PostgreSQL started on port 54329.');

  // 3. Ensure role preone and database preone
  const adminClient = new pg.Client({
    connectionString: 'postgresql://postgres:postgresPassword@127.0.0.1:54329/postgres'
  });
  await adminClient.connect();

  const roleRes = await adminClient.query(`SELECT 1 FROM pg_roles WHERE rolname='preone'`);
  if (roleRes.rowCount === 0) {
    await adminClient.query(`CREATE ROLE preone LOGIN PASSWORD 'preone' CREATEDB SUPERUSER;`);
    console.log('[pg] Role "preone" created.');
  }

  const dbRes = await adminClient.query(`SELECT 1 FROM pg_database WHERE datname='preone'`);
  if (dbRes.rowCount === 0) {
    await adminClient.query(`CREATE DATABASE preone OWNER preone;`);
    console.log('[pg] Database "preone" created.');
  }
  await adminClient.end();
}

if (process.argv[1] && process.argv[1].endsWith('pg-start-win.mjs')) {
  ensurePostgresRunning().catch(err => {
    console.error('[pg] Error starting postgres:', err);
    process.exit(1);
  });
}
