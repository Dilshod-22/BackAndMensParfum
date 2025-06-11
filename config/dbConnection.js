const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.pgConnection_username,
  host: process.env.pgConnection_host,
  database:process.env.pgConnection_database,
  password: process.env.pgConnection_password,
  port: process.env.port,
});
module.exports = pool;
