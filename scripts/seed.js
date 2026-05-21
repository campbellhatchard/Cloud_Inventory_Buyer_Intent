const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log("Seeding security and role schema...");
    const defaultHash = await bcrypt.hash("1Password!", 10);

    const admin = await client.query(
      `insert into users
        (first_name, last_name, full_name, email, role, is_active, password_hash, must_change_password)
       values
        ('Campbell', 'Hatchard', 'Campbell Hatchard', 'Campbell.hatchard@cloudinventory.com', 'Admin', true, $1, true)
       returning id`,
      [defaultHash]
    );

    const manager = await client.query(
      `insert into users
        (first_name, last_name, full_name, email, role, is_active, password_hash, must_change_password)
       values
        ('Michelle', 'Reid', 'Michelle Reid', 'Michelle.reid@cloudinventory.com', 'Manager', true, $1, true)
       returning id`,
      [defaultHash]
    );

    const user = await client.query(
      `insert into users
        (first_name, last_name, full_name, email, role, is_active, password_hash, must_change_password)
       values
        ('John', 'Smith', 'John Smith', 'john.smith@cloudinventory.com', 'User', true, $1, true)
       returning id`,
      [defaultHash]
    );

    const account = await client.query(
      `insert into accounts
        (account_name, domain, industry, owner_id, locations, parent_name, subsidiaries, address, state, zip, phone_number, priority, stage, intent_score, trigger_score, fit_score, confidence_score, overall_score, why_now)
       values
        ('Sample Distribution Group', 'sampledistribution.com', 'Distribution / Wholesale', $1, 'Multi-location', 'Sample Holdings Inc.', 'West Regional Distribution; Fleet Services Division', '100 Main St', 'KS', '66215', '555-111-2222', 'P1', 'Late', 79, 74, 86, 89, 81, 'Recent warehouse expansion, ERP hiring, and inventory-visibility language suggest rising operational complexity and an active modernization window.')
       returning id`,
      [manager.rows[0].id]
    );

    const unassignedAccount = await client.query(
      `insert into accounts
        (account_name, domain, industry, owner_id, locations, parent_name, subsidiaries, address, state, zip, phone_number, priority, stage, intent_score, trigger_score, fit_score, confidence_score, overall_score, why_now)
       values
        ('Open Territory Supply', 'openterritorysupply.com', 'Distribution / Wholesale', null, 'Regional', '', '', '200 Central Ave', 'KS', '66210', '555-777-9999', 'P2', 'Mid', 61, 58, 67, 72, 64, 'Account is currently unassigned and suitable for direct user claim.')
       returning id`
    );

    await client.query(
      `insert into contacts
        (account_id, first_name, last_name, company_position, contact_number, email_address, linkedin_profile)
       values
        ($1, 'Rachel', 'Turner', 'Supply Chain Director', '555-333-4444', 'rachel.turner@example.com', 'https://www.linkedin.com/in/rachel-turner'),
        ($1, 'David', 'Mills', 'VP Operations', '555-111-5555', 'david.mills@example.com', 'https://www.linkedin.com/in/david-mills')`,
      [account.rows[0].id]
    );

    await client.query(`
      insert into scoring_weights (intent_weight, trigger_weight, fit_weight, confidence_weight)
      values (0.35, 0.20, 0.30, 0.15)
    `);

    await client.query(`
      INSERT INTO sources (category, name, url, is_derived)
      VALUES
      ('Company Website', 'Company Website', 'Derived from account domain', true),
      ('Company Website', 'Company Newsroom', 'Derived from company site', true),
      ('Careers Pages / Job Postings', 'LinkedIn Jobs', 'https://www.linkedin.com/jobs', false),
      ('Press Releases / PR Wires', 'Business Wire', 'https://www.businesswire.com', false),
      ('Industry Publications', 'Supply Chain Dive', 'https://www.supplychaindive.com', false),
      ('Public Filings / Investor Materials', 'SEC EDGAR', 'https://www.sec.gov/edgar', false),
      ('Social Posts', 'LinkedIn', 'https://www.linkedin.com', false),
      ('Technographic Inference', 'BuiltWith', 'https://builtwith.com', false);
    `);

    await client.query(
      `INSERT INTO signals
        (account_id, signal_type, detail, source_name, source_category, source_url, source_date, strength, confidence)
       VALUES
        ($1, 'Warehouse expansion', 'Announced a new distribution center to support regional growth.', 'Business Wire', 'Press Releases / PR Wires', 'https://example.com/warehouse-expansion', '2026-04-02', 90, 82),
        ($1, 'ERP / WMS hiring', 'Seeking ERP Program Manager for warehouse systems modernization.', 'Company Careers Page', 'Careers Pages / Job Postings', 'https://example.com/erp-role', '2026-03-30', 92, 90),
        ($1, 'Inventory accuracy or stock issue', 'Leadership highlighted improving inventory visibility and fulfillment consistency.', 'Investor Update', 'Company Website', 'https://example.com/inventory-update', '2026-03-14', 70, 95),
        ($2, 'Deep solution content consumption', 'Site activity indicates current research against fulfillment and inventory topics.', 'Website Behavioral', 'Company Website', 'https://example.com/research', '2026-04-05', 68, 76)`,
      [account.rows[0].id, unassignedAccount.rows[0].id]
    );

    await client.query(
      `insert into audit_events (actor_user_id, event_type, detail)
       values
        ($1, 'seed_created', '{"note":"Initial admin created"}'::jsonb),
        ($1, 'seed_created', '{"default_password":"1Password!"}'::jsonb)`,
      [admin.rows[0].id]
    );

    console.log("Security and role seed completed successfully");
    console.log("Admin login: Campbell.hatchard@cloudinventory.com");
    console.log("Default password: 1Password!");
  } catch (err) {
    console.error("Error seeding DB:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
