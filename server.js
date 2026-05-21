const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("./db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, "dist");
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(distPath));

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.full_name,
    },
    JWT_SECRET,
    { expiresIn: "12h" }
  );
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const [, token] = auth.split(" ");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

async function audit(client, actorUserId, eventType, detail) {
  await client.query(
    `insert into audit_events (actor_user_id, event_type, detail)
     values ($1,$2,$3::jsonb)`,
    [actorUserId || null, eventType, JSON.stringify(detail || {})]
  );
}

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/readiness", async (_req, res) => {
  try {
    await pool.query("select 1");
    res.json({ status: "ready" });
  } catch (e) {
    res.status(500).json({ status: "not_ready", error: e.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query(
      `select id, first_name, last_name, full_name, email, role, is_active, password_hash, must_change_password
       from users
       where lower(email) = lower($1)
       limit 1`,
      [email]
    );
    const user = rows[0];
    if (!user || !user.is_active) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.full_name,
        must_change_password: user.must_change_password,
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `select id, email, role, full_name, must_change_password
       from users
       where id = $1`,
      [req.user.sub]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    res.json({
      user: {
        id: rows[0].id,
        email: rows[0].email,
        role: rows[0].role,
        name: rows[0].full_name,
        must_change_password: rows[0].must_change_password,
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/auth/change-password", requireAuth, async (req, res) => {
  try {
    const { original_password, new_password, confirm_password } = req.body;
    if (!original_password || !new_password || !confirm_password) return res.status(400).json({ error: "All password fields are required" });
    if (new_password !== confirm_password) return res.status(400).json({ error: "New passwords do not match" });

    const { rows } = await pool.query(`select id, password_hash from users where id = $1`, [req.user.sub]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    const ok = await bcrypt.compare(original_password, user.password_hash);
    if (!ok) return res.status(400).json({ error: "Original password is incorrect" });

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query(
      `update users
       set password_hash = $1,
           must_change_password = false,
           updated_at = now()
       where id = $2`,
      [newHash, req.user.sub]
    );

    const client = await pool.connect();
    try {
      await audit(client, req.user.sub, "password_changed", { user_id: req.user.sub });
    } finally {
      client.release();
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/users/active", requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `select id, first_name, last_name, full_name, email, role, is_active
       from users
       where is_active = true
       order by full_name`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/admin/users", requireAuth, requireRole("Admin"), async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `select id, first_name, last_name, full_name, email, role, is_active, must_change_password, created_at, updated_at
       from users
       order by full_name`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/users", requireAuth, requireRole("Admin"), async (req, res) => {
  const client = await pool.connect();
  try {
    const { first_name, last_name, email, role, is_active } = req.body;
    const full_name = `${first_name} ${last_name}`.trim();
    const passwordHash = await bcrypt.hash("1Password!", 10);
    const { rows } = await client.query(
      `insert into users
        (first_name, last_name, full_name, email, role, is_active, password_hash, must_change_password)
       values ($1,$2,$3,$4,$5,$6,$7,true)
       returning id, first_name, last_name, full_name, email, role, is_active, must_change_password`,
      [first_name, last_name, full_name, email, role, is_active !== false, passwordHash]
    );
    await audit(client, req.user.sub, "user_created", { user_id: rows[0].id, email, role });
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

app.put("/api/admin/users/:id", requireAuth, requireRole("Admin"), async (req, res) => {
  const client = await pool.connect();
  try {
    const { first_name, last_name, email, role, is_active } = req.body;
    const full_name = `${first_name} ${last_name}`.trim();
    const { rows } = await client.query(
      `update users
       set first_name = $1,
           last_name = $2,
           full_name = $3,
           email = $4,
           role = $5,
           is_active = $6,
           updated_at = now()
       where id = $7
       returning id, first_name, last_name, full_name, email, role, is_active, must_change_password`,
      [first_name, last_name, full_name, email, role, !!is_active, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    await audit(client, req.user.sub, "user_updated", { user_id: req.params.id, email, role, is_active: !!is_active });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

app.patch("/api/admin/users/:id/status", requireAuth, requireRole("Admin"), async (req, res) => {
  const client = await pool.connect();
  try {
    const { is_active } = req.body;
    const { rows } = await client.query(
      `update users
       set is_active = $1,
           updated_at = now()
       where id = $2
       returning id, first_name, last_name, full_name, email, role, is_active, must_change_password`,
      [!!is_active, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    await audit(client, req.user.sub, "user_status_changed", { user_id: req.params.id, is_active: !!is_active });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

app.post("/api/admin/users/:id/reset-password", requireAuth, requireRole("Admin"), async (req, res) => {
  const client = await pool.connect();
  try {
    const hash = await bcrypt.hash("1Password!", 10);
    const { rows } = await client.query(
      `update users
       set password_hash = $1,
           must_change_password = true,
           updated_at = now()
       where id = $2
       returning id, email`,
      [hash, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    await audit(client, req.user.sub, "password_reset", { user_id: req.params.id });
    res.json({ ok: true, user: rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

app.delete("/api/admin/users/:id", requireAuth, requireRole("Admin"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `update accounts
       set owner_id = null,
           updated_at = now()
       where owner_id = $1`,
      [req.params.id]
    );
    const { rows } = await client.query(
      `delete from users
       where id = $1
       returning id, email`,
      [req.params.id]
    );
    if (!rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }
    await audit(client, req.user.sub, "user_deleted", { user_id: req.params.id, email: rows[0].email });
    await client.query("COMMIT");
    res.json({ ok: true, user: rows[0] });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

app.get("/api/accounts", requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `select a.*, u.first_name as owner_first_name, u.last_name as owner_last_name, u.full_name as owner_full_name
       from accounts a
       left join users u on a.owner_id = u.id
       order by a.overall_score desc nulls last, a.updated_at desc`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/accounts", requireAuth, requireRole("Admin", "Manager"), async (req, res) => {
  try {
    const { account, domain, industry, owner_id, locations, parent, subsidiaries, address, state, zip, phone_number } = req.body;
    const { rows } = await pool.query(
      `insert into accounts
        (account_name, domain, industry, owner_id, locations, parent_name, subsidiaries, address, state, zip, phone_number, priority, stage, intent_score, trigger_score, fit_score, confidence_score, overall_score, why_now)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'P3','Early',0,0,0,0,0,'')
       returning *`,
      [account, domain, industry, owner_id || null, locations || "", parent || "", subsidiaries || "", address || "", state || "", zip || "", phone_number || ""]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch("/api/accounts/:id/owner", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { owner_id } = req.body;
    const acct = await client.query(`select id, owner_id from accounts where id = $1`, [req.params.id]);
    if (!acct.rows[0]) return res.status(404).json({ error: "Account not found" });

    const currentOwnerId = acct.rows[0].owner_id;
    const requesterId = req.user.sub;
    const requesterRole = req.user.role;

    let allowed = false;
    if (requesterRole === "Admin" || requesterRole === "Manager") {
      allowed = true;
    } else if (requesterRole === "User") {
      if (!currentOwnerId && (owner_id === requesterId || owner_id === null || owner_id === "")) allowed = true;
      if (currentOwnerId === requesterId) allowed = true;
    }

    if (!allowed) return res.status(403).json({ error: "You cannot change this owner assignment" });

    const { rows } = await client.query(
      `update accounts
       set owner_id = $1,
           updated_at = now()
       where id = $2
       returning *`,
      [owner_id || null, req.params.id]
    );

    await audit(client, req.user.sub, "account_owner_changed", {
      account_id: req.params.id,
      from_owner_id: currentOwnerId,
      to_owner_id: owner_id || null,
      changed_by_user_id: req.user.sub,
      changed_by_role: req.user.role,
    });

    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

app.get("/api/accounts/:id/signals", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `select * from signals where account_id = $1 order by source_date desc nulls last, created_at desc`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/accounts/:id/contacts", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `select * from contacts where account_id = $1 order by last_name, first_name`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/contacts", requireAuth, async (req, res) => {
  try {
    const { account_id, first_name, last_name, company_position, contact_number, email_address, linkedin_profile } = req.body;
    const { rows } = await pool.query(
      `insert into contacts
        (account_id, first_name, last_name, company_position, contact_number, email_address, linkedin_profile)
       values ($1,$2,$3,$4,$5,$6,$7)
       returning *`,
      [account_id, first_name, last_name, company_position || "", contact_number || "", email_address || "", linkedin_profile || ""]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/contacts/:id", requireAuth, async (req, res) => {
  try {
    const { first_name, last_name, company_position, contact_number, email_address, linkedin_profile } = req.body;
    const { rows } = await pool.query(
      `update contacts
       set first_name = $1,
           last_name = $2,
           company_position = $3,
           contact_number = $4,
           email_address = $5,
           linkedin_profile = $6
       where id = $7
       returning *`,
      [first_name, last_name, company_position || "", contact_number || "", email_address || "", linkedin_profile || "", req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Contact not found" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/contacts/:id", requireAuth, async (req, res) => {
  try {
    await pool.query(`delete from contacts where id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/sources", requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query(`select * from sources order by category, name`);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/sources", requireAuth, requireRole("Admin"), async (req, res) => {
  try {
    const { category, name, url, is_derived } = req.body;
    const { rows } = await pool.query(
      `insert into sources (category, name, url, is_derived)
       values ($1,$2,$3,$4)
       returning *`,
      [category, name, url, !!is_derived]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/admin/scoring", requireAuth, requireRole("Admin"), async (_req, res) => {
  try {
    const { rows } = await pool.query(`select * from scoring_weights limit 1`);
    if (!rows[0]) {
      const inserted = await pool.query(
        `insert into scoring_weights (intent_weight, trigger_weight, fit_weight, confidence_weight)
         values (0.35, 0.20, 0.30, 0.15)
         returning *`
      );
      return res.json(inserted.rows[0]);
    }
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/admin/scoring", requireAuth, requireRole("Admin"), async (req, res) => {
  try {
    const { intent_weight, trigger_weight, fit_weight, confidence_weight } = req.body;
    const existing = await pool.query(`select id from scoring_weights limit 1`);
    let rows;
    if (existing.rows[0]) {
      rows = (await pool.query(
        `update scoring_weights
         set intent_weight = $1,
             trigger_weight = $2,
             fit_weight = $3,
             confidence_weight = $4,
             updated_at = now()
         where id = $5
         returning *`,
        [intent_weight, trigger_weight, fit_weight, confidence_weight, existing.rows[0].id]
      )).rows;
    } else {
      rows = (await pool.query(
        `insert into scoring_weights (intent_weight, trigger_weight, fit_weight, confidence_weight)
         values ($1,$2,$3,$4)
         returning *`,
        [intent_weight, trigger_weight, fit_weight, confidence_weight]
      )).rows;
    }
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/admin/audit", requireAuth, requireRole("Admin"), async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `select a.id, a.event_type, a.detail, a.created_at, u.email as actor_email, u.full_name as actor_name
       from audit_events a
       left join users u on a.actor_user_id = u.id
       order by a.created_at desc
       limit 250`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
