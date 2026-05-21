const { Pool } = require("pg");
require("dotenv").config();

const ssl = process.env.DATABASE_URL && process.env.DATABASE_URL.includes("render.com")
  ? { rejectUnauthorized: false }
  : false;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
});

module.exports = { pool };
