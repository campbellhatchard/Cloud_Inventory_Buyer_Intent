const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log("Initializing security and role schema...");
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await client.query(`
      DROP TABLE IF EXISTS contacts CASCADE;
      DROP TABLE IF EXISTS signals CASCADE;
      DROP TABLE IF EXISTS accounts CASCADE;
      DROP TABLE IF EXISTS sources CASCADE;
      DROP TABLE IF EXISTS scoring_weights CASCADE;
      DROP TABLE IF EXISTS audit_events CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    await client.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL CHECK (role in ('User','Manager','Admin')),
        is_active BOOLEAN NOT NULL DEFAULT true,
        password_hash TEXT NOT NULL,
        must_change_password BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_name TEXT NOT NULL,
        domain TEXT,
        industry TEXT,
        owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
        locations TEXT,
        parent_name TEXT,
        subsidiaries TEXT,
        address TEXT,
        state TEXT,
        zip TEXT,
        phone_number TEXT,
        priority TEXT DEFAULT 'P3',
        stage TEXT DEFAULT 'Early',
        intent_score INTEGER DEFAULT 0,
        trigger_score INTEGER DEFAULT 0,
        fit_score INTEGER DEFAULT 0,
        confidence_score INTEGER DEFAULT 0,
        overall_score INTEGER DEFAULT 0,
        why_now TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
        first_name TEXT,
        last_name TEXT,
        company_position TEXT,
        contact_number TEXT,
        email_address TEXT,
        linkedin_profile TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE sources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category TEXT,
        name TEXT,
        url TEXT,
        is_derived BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE signals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
        signal_type TEXT,
        detail TEXT,
        source_name TEXT,
        source_category TEXT,
        source_url TEXT,
        source_date TIMESTAMP,
        strength INTEGER,
        confidence INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE scoring_weights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        intent_weight NUMERIC(5,2) DEFAULT 0.35,
        trigger_weight NUMERIC(5,2) DEFAULT 0.20,
        fit_weight NUMERIC(5,2) DEFAULT 0.30,
        confidence_weight NUMERIC(5,2) DEFAULT 0.15,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE audit_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        event_type TEXT NOT NULL,
        detail JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Security and role schema created successfully");
  } catch (err) {
    console.error("Error initializing DB:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
