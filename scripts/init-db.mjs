import pg from 'pg';

async function init() {
  const c = new pg.Client({ host: '127.0.0.1', port: 54329, user: 'postgres', database: 'postgres' });
  await c.connect();
  try {
    await c.query(`CREATE ROLE preone WITH LOGIN PASSWORD 'preone' SUPERUSER CREATEDB;`);
    console.log('Created role preone');
  } catch (e) {
    console.log('Role preone note:', e.message);
  }
  try {
    await c.query(`CREATE DATABASE preone OWNER preone;`);
    console.log('Created database preone');
  } catch (e) {
    console.log('Database preone note:', e.message);
  }
  try {
    await c.query(`ALTER ROLE postgres WITH PASSWORD 'postgres';`);
    console.log('Altered role postgres');
  } catch (e) {
    console.log('Postgres alter note:', e.message);
  }
  await c.end();
  console.log('Init done!');
}

init().catch(console.error);
