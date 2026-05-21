import React, { useEffect, useMemo, useState } from "react";

const styles = {
  page: { fontFamily: "Arial, Helvetica, sans-serif", minHeight: "100vh", background: "#F8FAFC", color: "#0F172A", padding: 24 },
  container: { maxWidth: 1320, margin: "0 auto" },
  header: { background: "#0F172A", color: "#FFFFFF", borderRadius: 24, padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap", boxShadow: "0 4px 18px rgba(15,23,42,0.12)" },
  headerLeft: { display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" },
  logoWrap: { width: 74, height: 74, borderRadius: 14, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, padding: 8 },
  badgeRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  badge: { display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "7px 12px", fontSize: 12, fontWeight: 700, background: "#8DC63F", color: "#0F172A" },
  badgeAlt: { display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "7px 12px", fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.12)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.18)" },
  nav: { marginTop: 18, display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 8, background: "#E2E8F0", borderRadius: 20, padding: 8 },
  navBtn: { border: 0, borderRadius: 16, padding: "11px 10px", fontWeight: 700, fontSize: 14, cursor: "pointer", background: "#FFFFFF", color: "#334155" },
  navBtnActive: { background: "#0F172A", color: "#FFFFFF" },
  card: { marginTop: 18, background: "#FFFFFF", borderRadius: 24, border: "1px solid #E2E8F0", boxShadow: "0 2px 10px rgba(15,23,42,0.04)" },
  cardHeader: { padding: "24px 24px 12px" },
  cardBody: { padding: "0 24px 24px" },
  title: { margin: 0, fontSize: 24, fontWeight: 800, color: "#0F172A" },
  subtitle: { margin: "6px 0 0", fontSize: 14, color: "#64748B" },
  greenBtn: { display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 16, padding: "11px 16px", border: 0, background: "#8DC63F", color: "#0F172A", fontWeight: 700, cursor: "pointer" },
  secondaryBtn: { display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 16, padding: "11px 16px", border: "1px solid #E2E8F0", background: "#FFFFFF", color: "#0F172A", fontWeight: 700, cursor: "pointer" },
  dangerBtn: { display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 16, padding: "9px 14px", border: "1px solid #FECACA", background: "#FEF2F2", color: "#991B1B", fontWeight: 700, cursor: "pointer" },
  input: { width: "100%", border: "1px solid #CBD5E1", borderRadius: 14, padding: "10px 12px", fontSize: 14, background: "#FFFFFF", color: "#0F172A", boxSizing: "border-box" },
  select: { width: "100%", border: "1px solid #CBD5E1", borderRadius: 14, padding: "10px 12px", fontSize: 14, background: "#FFFFFF", color: "#0F172A", boxSizing: "border-box" },
  smallSelect: { width: "100%", border: "1px solid #CBD5E1", borderRadius: 12, padding: "8px 10px", fontSize: 13, background: "#FFFFFF", color: "#0F172A", boxSizing: "border-box" },
  textarea: { width: "100%", border: "1px solid #CBD5E1", borderRadius: 14, padding: "10px 12px", fontSize: 14, minHeight: 90, background: "#FFFFFF", color: "#0F172A", boxSizing: "border-box" },
  loginWrap: { maxWidth: 460, margin: "80px auto", background: "#FFFFFF", borderRadius: 24, border: "1px solid #E2E8F0", padding: 28, boxShadow: "0 4px 18px rgba(15,23,42,0.08)" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 },
  grid5: { display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 14 },
  infoBox: { border: "1px solid #E2E8F0", borderRadius: 18, padding: 16, background: "#FFFFFF" },
  infoLabel: { fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 },
  split: { display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 18 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 14px", fontSize: 12, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.4, background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", verticalAlign: "top" },
  td: { padding: "14px", fontSize: 14, color: "#334155", borderBottom: "1px solid #E2E8F0", verticalAlign: "top" },
  clickableHeader: { border: 0, background: "transparent", cursor: "pointer", padding: 0, fontSize: 12, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.4 },
  metricLabel: { fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 },
  muted: { color: "#64748B" },
};

function bandColor(value) {
  if (value < 10) return "#991B1B";
  if (value < 20) return "#B91C1C";
  if (value < 30) return "#C2410C";
  if (value < 40) return "#D97706";
  if (value < 50) return "#CA8A04";
  if (value < 60) return "#65A30D";
  if (value < 70) return "#4D7C0F";
  if (value < 80) return "#16A34A";
  if (value < 90) return "#15803D";
  return "#166534";
}
function metricCard(value) { return { borderRadius: 22, border: `2px solid ${bandColor(value)}`, background: `${bandColor(value)}14`, padding: 16, textAlign: "center" }; }
function metricValue(value) { return { marginTop: 8, fontSize: 30, fontWeight: 800, color: bandColor(value) }; }
function priorityScore(priority) { return priority === "P1" ? 95 : priority === "P2" ? 65 : 35; }

async function api(path, method = "GET", body, token) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function Login({ onLogin }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  return (
    <div style={styles.loginWrap}>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <img src="/cloudinventory-logo.png" alt="Cloud Inventory" style={{ height: 72, objectFit: "contain" }} />
      </div>
      <h1 style={{ ...styles.title, textAlign: "center" }}>Sign in</h1>
      <p style={{ ...styles.subtitle, textAlign: "center", marginBottom: 18 }}>Cloud Inventory Buyer Intent Platform</p>
      <div style={{ display: "grid", gap: 14 }}>
        <input style={styles.input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input style={styles.input} placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <div style={{ color: "#991B1B", fontSize: 14 }}>{error}</div> : null}
        <button style={styles.greenBtn} onClick={async () => {
          try {
            setError("");
            const result = await api("/api/auth/login", "POST", { email, password });
            onLogin(result);
          } catch (e) { setError(e.message); }
        }}>Sign In</button>
      </div>
    </div>
  );
}

function ChangePassword({ token, user, onDone }) {
  const [originalPassword, setOriginalPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");

  return (
    <div style={styles.loginWrap}>
      <h1 style={{ ...styles.title, textAlign: "center" }}>Change Password</h1>
      <p style={{ ...styles.subtitle, textAlign: "center", marginBottom: 18 }}>
        Welcome {user?.name}. You must change your password before accessing the system.
      </p>
      <div style={{ display: "grid", gap: 14 }}>
        <input style={styles.input} type="password" placeholder="Original Password" value={originalPassword} onChange={(e) => setOriginalPassword(e.target.value)} />
        <input style={styles.input} type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Re-enter New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        {error ? <div style={{ color: "#991B1B", fontSize: 14 }}>{error}</div> : null}
        <button style={styles.greenBtn} onClick={async () => {
          try {
            setError("");
            await api("/api/auth/change-password", "POST", {
              original_password: originalPassword,
              new_password: newPassword,
              confirm_password: confirmPassword,
            }, token);
            onDone();
          } catch (e) { setError(e.message); }
        }}>Update Password</button>
      </div>
    </div>
  );
}

function Header({ user, onLogout }) {
  return (
    <div style={styles.header}>
      <div style={styles.headerLeft}>
        <div style={styles.logoWrap}>
          <img src="/cloudinventory-logo.png" alt="Cloud Inventory" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>Cloud Inventory Buyer Intent Platform</div>
          <div style={{ marginTop: 6, color: "rgba(255,255,255,0.78)", fontSize: 14 }}>
            Prioritize target accounts, validate buyer intent, and equip BDRs with commercially relevant discovery angles.
          </div>
        </div>
      </div>
      <div style={styles.badgeRow}>
        <div style={styles.badge}>{user?.role || "user"}</div>
        <div style={styles.badgeAlt}>{user?.name || ""}</div>
        <button style={styles.secondaryBtn} onClick={onLogout}>Sign Out</button>
      </div>
    </div>
  );
}

function SourceSection({ title, items, canEdit, onAdd }) {
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}><h3 style={{ ...styles.title, fontSize: 20 }}>{title}</h3></div>
      <div style={styles.cardBody}>
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((item) => (
            <div key={item.id} style={styles.infoBox}>
              <div style={{ fontWeight: 700 }}>{item.name}</div>
              <div style={{ color: "#64748B", marginTop: 4, wordBreak: "break-all", fontSize: 13 }}>{item.url}</div>
            </div>
          ))}
          {canEdit ? (
            <div style={{ ...styles.infoBox, borderStyle: "dashed" }}>
              <div style={styles.grid2}>
                <input style={styles.input} placeholder="Source name" value={name} onChange={(e) => setName(e.target.value)} />
                <input style={styles.input} placeholder="Site or RSS URL" value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
              <div style={{ marginTop: 12 }}>
                <button style={styles.greenBtn} onClick={() => { if (name && url) { onAdd({ name, url }); setName(""); setUrl(""); } }}>Add Source</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("ci_token");
    const user = localStorage.getItem("ci_user");
    return token && user ? { token, user: JSON.parse(user) } : null;
  });
  const [activeTab, setActiveTab] = useState("pipeline");
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [sources, setSources] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [signals, setSignals] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [sortField, setSortField] = useState("overall_score");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showAddContact, setShowAddContact] = useState(false);
  const [showUserAdmin, setShowUserAdmin] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newAccount, setNewAccount] = useState({
    account: "", domain: "", industry: "Distribution / Wholesale", owner_id: "", locations: "Multi-location",
    parent: "", subsidiaries: "", address: "", state: "", zip: "", phone_number: ""
  });
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newContact, setNewContact] = useState({
    first_name: "", last_name: "", company_position: "", contact_number: "", email_address: "", linkedin_profile: ""
  });
  const [userAdminForm, setUserAdminForm] = useState({ first_name: "", last_name: "", email: "", role: "User", is_active: true });
  const [adminWeights, setAdminWeights] = useState({ intent_weight: 0.35, trigger_weight: 0.20, fit_weight: 0.30, confidence_weight: 0.15 });
  const [integrationSettings, setIntegrationSettings] = useState({ websiteCookieMode: "not_connected", cookieConnectorName: "", cookieEndpointUrl: "", cookieAuthHeader: "", cookieWorkspaceId: "" });
  const [error, setError] = useState("");

  const token = auth?.token;
  const user = auth?.user;
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null;
  const isAdmin = user?.role === "Admin";
  const isManager = user?.role === "Manager";
  const canSeeAdmin = isAdmin;

  async function loadCore() {
    if (!token) return;
    try {
      const baseCalls = [
        api("/api/accounts", "GET", null, token),
        api("/api/users/active", "GET", null, token),
        api("/api/sources", "GET", null, token),
      ];
      const [acct, activeUsers, src] = await Promise.all(baseCalls);
      setAccounts(acct);
      setUsers(activeUsers);
      setSources(src);
      if (acct.length && !selectedAccountId) setSelectedAccountId(acct[0].id);

      if (isAdmin) {
        const [scoring, adminUsers, audit] = await Promise.all([
          api("/api/admin/scoring", "GET", null, token),
          api("/api/admin/users", "GET", null, token),
          api("/api/admin/audit", "GET", null, token),
        ]);
        setAdminWeights(scoring);
        setAllUsers(adminUsers);
        setAuditEvents(audit);
      }

      setError("");
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { if (token) loadCore(); }, [token]);

  useEffect(() => {
    if (!token || !selectedAccountId) return;
    Promise.all([
      api(`/api/accounts/${selectedAccountId}/signals`, "GET", null, token),
      api(`/api/accounts/${selectedAccountId}/contacts`, "GET", null, token),
    ]).then(([sig, con]) => {
      setSignals(sig);
      setContacts(con);
    }).catch((e) => setError(e.message));
  }, [selectedAccountId, token]);

  const filteredAccounts = useMemo(() => {
    const filtered = accounts.filter((a) => {
      const ownerName = a.owner_full_name || "";
      return (
        (!search || a.account_name.toLowerCase().includes(search.toLowerCase()) || a.domain.toLowerCase().includes(search.toLowerCase())) &&
        (industryFilter === "all" || a.industry === industryFilter) &&
        (priorityFilter === "all" || a.priority === priorityFilter) &&
        (stageFilter === "all" || a.stage === stageFilter) &&
        (ownerFilter === "all" || ownerName === ownerFilter)
      );
    });
    return [...filtered].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === "number" && typeof bv === "number") return sortDirection === "asc" ? av - bv : bv - av;
      return sortDirection === "asc" ? String(av || "").localeCompare(String(bv || "")) : String(bv || "").localeCompare(String(av || ""));
    });
  }, [accounts, search, industryFilter, priorityFilter, stageFilter, ownerFilter, sortField, sortDirection]);

  const visibleTabs = [
    ["pipeline", "1. Pipeline"],
    ["account-overview", "2. Account Overview"],
    ["intent-overview", "3. Intent Overview"],
    ["bdr-intelligence", "4. BDR Intelligence"],
    ...(canSeeAdmin ? [["admin", "Admin"]] : []),
    ...(canSeeAdmin ? [["sources", "Sources"]] : []),
  ];

  if (!auth) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <Login onLogin={(result) => {
            localStorage.setItem("ci_token", result.token);
            localStorage.setItem("ci_user", JSON.stringify(result.user));
            setAuth(result);
          }} />
        </div>
      </div>
    );
  }

  if (auth.user.must_change_password) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <ChangePassword token={token} user={auth.user} onDone={async () => {
            const me = await api("/api/auth/me", "GET", null, token);
            localStorage.setItem("ci_user", JSON.stringify(me.user));
            setAuth((prev) => ({ ...prev, user: me.user }));
          }} />
        </div>
      </div>
    );
  }

  const sourceGroups = {
    "Company Website": sources.filter((s) => s.category === "Company Website"),
    "Careers Pages / Job Postings": sources.filter((s) => s.category === "Careers Pages / Job Postings"),
    "Press Releases / PR Wires": sources.filter((s) => s.category === "Press Releases / PR Wires"),
    "Industry Publications": sources.filter((s) => s.category === "Industry Publications"),
    "Public Filings / Investor Materials": sources.filter((s) => s.category === "Public Filings / Investor Materials"),
    "Social Posts": sources.filter((s) => s.category === "Social Posts"),
    "Technographic Inference": sources.filter((s) => s.category === "Technographic Inference"),
  };

  function canChangeOwner(account) {
    if (!user) return false;
    if (isAdmin || isManager) return true;
    if (user.role === "User") {
      if (!account.owner_id) return true;
      return account.owner_id === user.id;
    }
    return false;
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Header user={user} onLogout={() => {
          localStorage.removeItem("ci_token");
          localStorage.removeItem("ci_user");
          setAuth(null);
        }} />

        {error ? <div style={{ ...styles.infoBox, marginTop: 16, color: "#991B1B" }}>{error}</div> : null}

        <div style={styles.nav}>
          {visibleTabs.map(([key, label]) => (
            <button key={key} style={{ ...styles.navBtn, ...(activeTab === key ? styles.navBtnActive : {}) }} onClick={() => setActiveTab(key)}>{label}</button>
          ))}
        </div>

        {activeTab === "pipeline" && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <h2 style={styles.title}>Pipeline</h2>
                  <p style={styles.subtitle}>Landing page for account selection, prioritization, sorting, and filtering.</p>
                </div>
                {(isAdmin || isManager) ? <button style={styles.greenBtn} onClick={() => setShowAddAccount((v) => !v)}>+ Add Account</button> : null}
              </div>
            </div>
            <div style={styles.cardBody}>
              {showAddAccount && (isAdmin || isManager) ? (
                <div style={{ ...styles.infoBox, marginBottom: 16 }}>
                  <div style={styles.grid3}>
                    <input style={styles.input} placeholder="Company Name" value={newAccount.account} onChange={(e) => setNewAccount((p) => ({ ...p, account: e.target.value }))} />
                    <input style={styles.input} placeholder="Domain" value={newAccount.domain} onChange={(e) => setNewAccount((p) => ({ ...p, domain: e.target.value }))} />
                    <input style={styles.input} placeholder="Industry" value={newAccount.industry} onChange={(e) => setNewAccount((p) => ({ ...p, industry: e.target.value }))} />
                    <select style={styles.select} value={newAccount.owner_id} onChange={(e) => setNewAccount((p) => ({ ...p, owner_id: e.target.value }))}>
                      <option value="">Unassigned</option>
                      {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                    </select>
                    <select style={styles.select} value={newAccount.locations} onChange={(e) => setNewAccount((p) => ({ ...p, locations: e.target.value }))}>
                      <option>Single site</option>
                      <option>Regional</option>
                      <option>Multi-location</option>
                    </select>
                    <input style={styles.input} placeholder="Parent company" value={newAccount.parent} onChange={(e) => setNewAccount((p) => ({ ...p, parent: e.target.value }))} />
                    <input style={styles.input} placeholder="Address" value={newAccount.address} onChange={(e) => setNewAccount((p) => ({ ...p, address: e.target.value }))} />
                    <input style={styles.input} placeholder="State" value={newAccount.state} onChange={(e) => setNewAccount((p) => ({ ...p, state: e.target.value }))} />
                    <input style={styles.input} placeholder="ZIP" value={newAccount.zip} onChange={(e) => setNewAccount((p) => ({ ...p, zip: e.target.value }))} />
                    <input style={styles.input} placeholder="Phone Number" value={newAccount.phone_number} onChange={(e) => setNewAccount((p) => ({ ...p, phone_number: e.target.value }))} />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <textarea style={styles.textarea} placeholder="Subsidiaries / business units" value={newAccount.subsidiaries} onChange={(e) => setNewAccount((p) => ({ ...p, subsidiaries: e.target.value }))} />
                  </div>
                  <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                    <button style={styles.greenBtn} onClick={async () => {
                      try {
                        await api("/api/accounts", "POST", newAccount, token);
                        await loadCore();
                        setShowAddAccount(false);
                        setNewAccount({ account: "", domain: "", industry: "Distribution / Wholesale", owner_id: "", locations: "Multi-location", parent: "", subsidiaries: "", address: "", state: "", zip: "", phone_number: "" });
                      } catch (e) { setError(e.message); }
                    }}>Create Account</button>
                    <button style={styles.secondaryBtn} onClick={() => setShowAddAccount(false)}>Cancel</button>
                  </div>
                </div>
              ) : null}

              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {[["account_name", "Account"], ["industry", "Industry"], ["owner_full_name", "Owner"], ["priority", "Priority"], ["overall_score", "Score"], ["stage", "Stage"], ["updated_at", "Updated"]].map(([field, label]) => (
                        <th key={field} style={styles.th}>{field !== "updated_at" ? <button style={styles.clickableHeader} onClick={() => { setSortField(field); setSortDirection((d) => d === "asc" ? "desc" : "asc"); }}>{label} ↕</button> : label}</th>
                      ))}
                    </tr>
                    <tr>
                      <th style={{ ...styles.th, background: "#FFFFFF" }}><input style={{ ...styles.input, padding: "8px 10px" }} placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} /></th>
                      <th style={{ ...styles.th, background: "#FFFFFF" }}><input style={styles.smallSelect} value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} placeholder="all" /></th>
                      <th style={{ ...styles.th, background: "#FFFFFF" }}>
                        <select style={styles.smallSelect} value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
                          <option value="all">All</option>
                          {users.map((u) => <option key={u.id} value={u.full_name}>{u.full_name}</option>)}
                        </select>
                      </th>
                      <th style={{ ...styles.th, background: "#FFFFFF" }}>
                        <select style={styles.smallSelect} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                          <option value="all">All</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option>
                        </select>
                      </th>
                      <th style={{ ...styles.th, background: "#FFFFFF" }}>{sortField === "overall_score" ? (sortDirection === "asc" ? "Low → High" : "High → Low") : "Sort above"}</th>
                      <th style={{ ...styles.th, background: "#FFFFFF" }}>
                        <select style={styles.smallSelect} value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
                          <option value="all">All</option><option value="Early">Early</option><option value="Mid">Mid</option><option value="Late">Late</option>
                        </select>
                      </th>
                      <th style={{ ...styles.th, background: "#FFFFFF" }}>Latest first</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((account) => (
                      <tr key={account.id}>
                        <td style={styles.td} onClick={() => { setSelectedAccountId(account.id); setActiveTab("account-overview"); }}>
                          <div style={{ fontWeight: 700 }}>{account.account_name}</div>
                          <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>{account.domain}</div>
                        </td>
                        <td style={styles.td}>{account.industry}</td>
                        <td style={styles.td}>
                          <select
                            style={styles.smallSelect}
                            disabled={!canChangeOwner(account)}
                            value={account.owner_id || ""}
                            onChange={async (e) => {
                              try {
                                await api(`/api/accounts/${account.id}/owner`, "PATCH", { owner_id: e.target.value || null }, token);
                                await loadCore();
                              } catch (err) { setError(err.message); }
                            }}
                          >
                            <option value="">Unassigned</option>
                            {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                          </select>
                          {!canChangeOwner(account) ? <div style={{ fontSize: 11, color: "#991B1B", marginTop: 4 }}>Restricted</div> : null}
                        </td>
                        <td style={styles.td}><span style={{ display: "inline-flex", borderRadius: 999, padding: "6px 10px", background: "#0F172A", color: "#FFF", fontSize: 12, fontWeight: 700 }}>{account.priority}</span></td>
                        <td style={styles.td}>{account.overall_score}</td>
                        <td style={styles.td}>{account.stage}</td>
                        <td style={styles.td}>{String(account.updated_at || "").slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "account-overview" && selectedAccount && (
          <>
            <div style={styles.grid5}>
              <div style={metricCard(selectedAccount.intent_score)}><div style={styles.metricLabel}>Intent</div><div style={metricValue(selectedAccount.intent_score)}>{selectedAccount.intent_score}</div></div>
              <div style={metricCard(selectedAccount.trigger_score)}><div style={styles.metricLabel}>Trigger</div><div style={metricValue(selectedAccount.trigger_score)}>{selectedAccount.trigger_score}</div></div>
              <div style={metricCard(selectedAccount.fit_score)}><div style={styles.metricLabel}>Fit</div><div style={metricValue(selectedAccount.fit_score)}>{selectedAccount.fit_score}</div></div>
              <div style={metricCard(selectedAccount.confidence_score)}><div style={styles.metricLabel}>Confidence</div><div style={metricValue(selectedAccount.confidence_score)}>{selectedAccount.confidence_score}</div></div>
              <div style={metricCard(priorityScore(selectedAccount.priority))}><div style={styles.metricLabel}>Priority</div><div style={metricValue(priorityScore(selectedAccount.priority))}>{selectedAccount.priority}</div></div>
            </div>

            <div style={styles.split}>
              <div style={styles.card}>
                <div style={styles.cardHeader}><h2 style={styles.title}>Account Overview</h2><p style={styles.subtitle}>Summary view for the selected account before drilling into evidence and BDR guidance.</p></div>
                <div style={styles.cardBody}>
                  <div style={styles.grid2}>
                    <div style={styles.infoBox}><div style={styles.infoLabel}>Company</div><div style={{ fontWeight: 800, fontSize: 18 }}>{selectedAccount.account_name}</div><div style={{ marginTop: 6, color: "#64748B" }}>{selectedAccount.industry}</div></div>
                    <div style={styles.infoBox}><div style={styles.infoLabel}>Domain</div><div style={{ fontWeight: 800, fontSize: 18 }}>{selectedAccount.domain}</div><div style={{ marginTop: 6, color: "#64748B" }}>{selectedAccount.locations}</div></div>
                    <div style={styles.infoBox}><div style={styles.infoLabel}>Parent</div><div>{selectedAccount.parent_name || "N/A"}</div></div>
                    <div style={styles.infoBox}><div style={styles.infoLabel}>Owner</div><div>{selectedAccount.owner_full_name || "Unassigned"}</div></div>
                    <div style={styles.infoBox}><div style={styles.infoLabel}>Address</div><div>{selectedAccount.address || "N/A"}</div></div>
                    <div style={styles.infoBox}><div style={styles.infoLabel}>State / ZIP</div><div>{[selectedAccount.state, selectedAccount.zip].filter(Boolean).join(" ") || "N/A"}</div></div>
                    <div style={styles.infoBox}><div style={styles.infoLabel}>Phone Number</div><div>{selectedAccount.phone_number || "N/A"}</div></div>
                    <div style={styles.infoBox}><div style={styles.infoLabel}>Subsidiaries / Business Units</div><div>{selectedAccount.subsidiaries || "N/A"}</div></div>
                  </div>
                  <div style={{ ...styles.infoBox, marginTop: 16 }}>
                    <div style={styles.infoLabel}>Why now</div>
                    <div style={styles.muted}>{selectedAccount.why_now || ""}</div>
                  </div>
                  <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                    <button style={styles.greenBtn} onClick={() => setActiveTab("intent-overview")}>View Intent Overview</button>
                    <button style={styles.secondaryBtn} onClick={() => setActiveTab("bdr-intelligence")}>View BDR Intelligence</button>
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div>
                      <h2 style={styles.title}>Known Contacts</h2>
                      <p style={styles.subtitle}>Named contacts associated with this account.</p>
                    </div>
                    <button style={styles.greenBtn} onClick={() => { setShowAddContact(true); setEditingContactId(null); setNewContact({ first_name: "", last_name: "", company_position: "", contact_number: "", email_address: "", linkedin_profile: "" }); }}>+ Add Contact</button>
                  </div>
                </div>
                <div style={styles.cardBody}>
                  {showAddContact ? (
                    <div style={{ ...styles.infoBox, marginBottom: 14 }}>
                      <div style={styles.grid2}>
                        <input style={styles.input} placeholder="First Name" value={newContact.first_name} onChange={(e) => setNewContact((p) => ({ ...p, first_name: e.target.value }))} />
                        <input style={styles.input} placeholder="Last Name" value={newContact.last_name} onChange={(e) => setNewContact((p) => ({ ...p, last_name: e.target.value }))} />
                        <input style={styles.input} placeholder="Company Position" value={newContact.company_position} onChange={(e) => setNewContact((p) => ({ ...p, company_position: e.target.value }))} />
                        <input style={styles.input} placeholder="Contact Number" value={newContact.contact_number} onChange={(e) => setNewContact((p) => ({ ...p, contact_number: e.target.value }))} />
                        <input style={styles.input} placeholder="Email Address" value={newContact.email_address} onChange={(e) => setNewContact((p) => ({ ...p, email_address: e.target.value }))} />
                        <input style={styles.input} placeholder="LinkedIn Profile" value={newContact.linkedin_profile} onChange={(e) => setNewContact((p) => ({ ...p, linkedin_profile: e.target.value }))} />
                      </div>
                      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                        <button style={styles.greenBtn} onClick={async () => {
                          try {
                            if (editingContactId) await api(`/api/contacts/${editingContactId}`, "PUT", newContact, token);
                            else await api("/api/contacts", "POST", { ...newContact, account_id: selectedAccount.id }, token);
                            const refreshed = await api(`/api/accounts/${selectedAccount.id}/contacts`, "GET", null, token);
                            setContacts(refreshed);
                            setShowAddContact(false);
                            setEditingContactId(null);
                            setNewContact({ first_name: "", last_name: "", company_position: "", contact_number: "", email_address: "", linkedin_profile: "" });
                          } catch (e) { setError(e.message); }
                        }}>{editingContactId ? "Save Contact" : "Add Contact"}</button>
                        <button style={styles.secondaryBtn} onClick={() => { setShowAddContact(false); setEditingContactId(null); }}>Cancel</button>
                      </div>
                    </div>
                  ) : null}

                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead><tr><th style={styles.th}>First Name</th><th style={styles.th}>Last Name</th><th style={styles.th}>Position</th><th style={styles.th}>Phone</th><th style={styles.th}>Email</th><th style={styles.th}>LinkedIn</th><th style={styles.th}>Actions</th></tr></thead>
                      <tbody>
                        {contacts.map((c) => (
                          <tr key={c.id}>
                            <td style={styles.td}>{c.first_name}</td>
                            <td style={styles.td}>{c.last_name}</td>
                            <td style={styles.td}>{c.company_position}</td>
                            <td style={styles.td}>{c.contact_number}</td>
                            <td style={styles.td}>{c.email_address}</td>
                            <td style={styles.td}>{c.linkedin_profile ? <a href={c.linkedin_profile} target="_blank" rel="noreferrer">Open</a> : "—"}</td>
                            <td style={styles.td}>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button style={styles.secondaryBtn} onClick={() => {
                                  setNewContact({
                                    first_name: c.first_name || "", last_name: c.last_name || "", company_position: c.company_position || "",
                                    contact_number: c.contact_number || "", email_address: c.email_address || "", linkedin_profile: c.linkedin_profile || "",
                                  });
                                  setEditingContactId(c.id);
                                  setShowAddContact(true);
                                }}>Edit</button>
                                <button style={styles.dangerBtn} onClick={async () => {
                                  try {
                                    await api(`/api/contacts/${c.id}`, "DELETE", null, token);
                                    const refreshed = await api(`/api/accounts/${selectedAccount.id}/contacts`, "GET", null, token);
                                    setContacts(refreshed);
                                  } catch (e) { setError(e.message); }
                                }}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {contacts.length === 0 ? <tr><td style={styles.td} colSpan={7}>No contacts yet.</td></tr> : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "intent-overview" && selectedAccount && (
          <div style={styles.card}>
            <div style={styles.cardHeader}><h2 style={styles.title}>Intent Overview</h2><p style={styles.subtitle}>Evidence-backed view of why this account is showing buyer intent, including source, date, and link.</p></div>
            <div style={styles.cardBody}>
              <div style={styles.grid4}>
                <div style={styles.infoBox}><div style={styles.infoLabel}>Account</div><div style={{ fontWeight: 800 }}>{selectedAccount.account_name}</div></div>
                <div style={styles.infoBox}><div style={styles.infoLabel}>Priority</div><div style={{ fontWeight: 800 }}>{selectedAccount.priority}</div></div>
                <div style={styles.infoBox}><div style={styles.infoLabel}>Score</div><div style={{ fontWeight: 800 }}>{selectedAccount.overall_score}</div></div>
                <div style={styles.infoBox}><div style={styles.infoLabel}>Stage</div><div style={{ fontWeight: 800 }}>{selectedAccount.stage}</div></div>
              </div>
              <div style={{ ...styles.tableWrap, marginTop: 16 }}>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>Signal</th><th style={styles.th}>Source</th><th style={styles.th}>Date</th><th style={styles.th}>Strength</th><th style={styles.th}>Confidence</th><th style={styles.th}>Link</th></tr></thead>
                  <tbody>
                    {signals.map((s) => (
                      <tr key={s.id}>
                        <td style={styles.td}><div style={{ fontWeight: 700 }}>{s.signal_type}</div><div style={{ marginTop: 4, fontSize: 12, color: "#64748B" }}>{s.detail}</div></td>
                        <td style={styles.td}><div>{s.source_name}</div><div style={{ marginTop: 4, fontSize: 12, color: "#64748B" }}>{s.source_category}</div></td>
                        <td style={styles.td}>{s.source_date ? String(s.source_date).slice(0, 10) : ""}</td>
                        <td style={styles.td}>{s.strength}</td>
                        <td style={styles.td}>{s.confidence}</td>
                        <td style={styles.td}>{s.source_url ? <a href={s.source_url} target="_blank" rel="noreferrer">Open Source</a> : "—"}</td>
                      </tr>
                    ))}
                    {signals.length === 0 ? <tr><td style={styles.td} colSpan={6}>No signals yet.</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "bdr-intelligence" && selectedAccount && (
          <div style={styles.split}>
            <div style={styles.card}>
              <div style={styles.cardHeader}><h2 style={styles.title}>BDR Intelligence</h2><p style={styles.subtitle}>Commercially usable insight for discovery, outreach, and stakeholder targeting.</p></div>
              <div style={styles.cardBody}>
                <div style={{ display: "grid", gap: 14 }}>
                  <div style={styles.infoBox}><div style={styles.infoLabel}>Discovery angle</div><div style={{ fontWeight: 700 }}>{selectedAccount.overall_score >= 60 ? "Inventory visibility and stock accuracy across sites" : "Operational improvement opportunity and process modernization"}</div></div>
                  <div style={styles.infoBox}><div style={styles.infoLabel}>Likely stakeholder</div><div style={{ fontWeight: 700 }}>{contacts[0] ? `${contacts[0].first_name} ${contacts[0].last_name} — ${contacts[0].company_position || "Known Contact"}` : "VP Supply Chain / Inventory Leadership"}</div></div>
                  <div style={styles.infoBox}><div style={styles.infoLabel}>Business problem hypothesis</div><div>Inventory visibility and fulfillment consistency may be under pressure as operations scale or systems modernize.</div></div>
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardHeader}><h2 style={styles.title}>Outreach Guidance</h2><p style={styles.subtitle}>Use directly in calls, emails, and account planning.</p></div>
              <div style={styles.cardBody}>
                <div style={{ display: "grid", gap: 14 }}>
                  <div style={styles.infoBox}><div style={styles.infoLabel}>Why now</div><div>{selectedAccount.why_now || "Signals and account activity indicate an opportunity window."}</div></div>
                  <div style={styles.infoBox}><div style={styles.infoLabel}>Suggested opener</div><div>I noticed recent public signals around inventory visibility and modernization at {selectedAccount.account_name}. How are you managing that today across locations, teams, and systems?</div></div>
                  <div style={styles.infoBox}><div style={styles.infoLabel}>Supporting entity notes</div><div>Parent: {selectedAccount.parent_name || "N/A"}</div><div style={{ marginTop: 6 }}>Subsidiaries / business units: {selectedAccount.subsidiaries || "N/A"}</div></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "admin" && isAdmin && (
          <>
            <div style={styles.split}>
              <div style={styles.card}>
                <div style={styles.cardHeader}><h2 style={styles.title}>Admin</h2><p style={styles.subtitle}>Scoring controls, user management, and connector configuration.</p></div>
                <div style={styles.cardBody}>
                  <div style={styles.infoLabel}>Intent Engine / Scoring Weights</div>
                  <div style={styles.grid4}>
                    {[["intent_weight", "Intent"], ["trigger_weight", "Trigger"], ["fit_weight", "Fit"], ["confidence_weight", "Confidence"]].map(([key, label]) => (
                      <div key={key} style={styles.infoBox}>
                        <div style={styles.infoLabel}>{label}</div>
                        <input style={styles.input} value={adminWeights[key] ?? ""} onChange={(e) => setAdminWeights((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button style={styles.greenBtn} onClick={async () => {
                      try {
                        const saved = await api("/api/admin/scoring", "PUT", adminWeights, token);
                        setAdminWeights(saved);
                      } catch (e) { setError(e.message); }
                    }}>Save Scoring</button>

                    <button
                      type="button"
                      style={styles.secondaryBtn}
                      onClick={() => {
                        setShowUserAdmin((prev) => !prev);
                        setEditingUserId(null);
                        setUserAdminForm({ first_name: "", last_name: "", email: "", role: "User", is_active: true });
                      }}
                    >
                      {showUserAdmin ? "Hide User Management" : "User Management"}
                    </button>
                  </div>

                  <div style={{ marginTop: 18, ...styles.infoLabel }}>Cookie Integration</div>
                  <div style={styles.grid2}>
                    <select style={styles.select} value={integrationSettings.websiteCookieMode} onChange={(e) => setIntegrationSettings((p) => ({ ...p, websiteCookieMode: e.target.value }))}>
                      <option value="not_connected">Not connected</option>
                      <option value="configured">Configured</option>
                      <option value="connected">Connected</option>
                    </select>
                    <input style={styles.input} placeholder="Connector name" value={integrationSettings.cookieConnectorName} onChange={(e) => setIntegrationSettings((p) => ({ ...p, cookieConnectorName: e.target.value }))} />
                    <input style={styles.input} placeholder="Endpoint / webhook URL" value={integrationSettings.cookieEndpointUrl} onChange={(e) => setIntegrationSettings((p) => ({ ...p, cookieEndpointUrl: e.target.value }))} />
                    <input style={styles.input} placeholder="Auth header / token reference" value={integrationSettings.cookieAuthHeader} onChange={(e) => setIntegrationSettings((p) => ({ ...p, cookieAuthHeader: e.target.value }))} />
                    <input style={styles.input} placeholder="Workspace / property ID" value={integrationSettings.cookieWorkspaceId} onChange={(e) => setIntegrationSettings((p) => ({ ...p, cookieWorkspaceId: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardHeader}><h2 style={styles.title}>Current Source Consumption</h2><p style={styles.subtitle}>Shows the source categories currently expected by the platform.</p></div>
                <div style={styles.cardBody}>
                  <div style={{ display: "grid", gap: 12 }}>
                    {[
                      ["Company website", "Directly tied to each account domain and its owned pages"],
                      ["Careers pages / job postings", "Company careers plus configured public job sites"],
                      ["Press releases / PR wires", "Company newsroom plus configured public PR sites"],
                      ["Industry publications", "Configured publication domains and feeds"],
                      ["Public filings / investor materials", "Investor relations pages and configured filing sources"],
                      ["Social posts", "Configured social platforms"],
                      ["Technographic inference", "Configured technographic sources"],
                    ].map(([label, desc]) => (
                      <div key={label} style={styles.infoBox}><div style={{ fontWeight: 700 }}>{label}</div><div style={{ marginTop: 6, color: "#64748B" }}>{desc}</div></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {showUserAdmin && (
              <>
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <h2 style={styles.title}>User Management</h2>
                    <p style={styles.subtitle}>Add, edit, activate/deactivate, reset passwords, and delete users.</p>
                  </div>
                  <div style={styles.cardBody}>
                    <div style={{ ...styles.infoBox, marginBottom: 16 }}>
                      <div style={styles.grid3}>
                        <input style={styles.input} placeholder="First Name" value={userAdminForm.first_name} onChange={(e) => setUserAdminForm((p) => ({ ...p, first_name: e.target.value }))} />
                        <input style={styles.input} placeholder="Last Name" value={userAdminForm.last_name} onChange={(e) => setUserAdminForm((p) => ({ ...p, last_name: e.target.value }))} />
                        <input style={styles.input} placeholder="Email Address" value={userAdminForm.email} onChange={(e) => setUserAdminForm((p) => ({ ...p, email: e.target.value }))} />
                        <select style={styles.select} value={userAdminForm.role} onChange={(e) => setUserAdminForm((p) => ({ ...p, role: e.target.value }))}>
                          <option value="User">User</option>
                          <option value="Manager">Manager</option>
                          <option value="Admin">Admin</option>
                        </select>
                        <select style={styles.select} value={userAdminForm.is_active ? "Yes" : "No"} onChange={(e) => setUserAdminForm((p) => ({ ...p, is_active: e.target.value === "Yes" }))}>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                        <button style={styles.greenBtn} onClick={async () => {
                          try {
                            if (editingUserId) {
                              await api(`/api/admin/users/${editingUserId}`, "PUT", userAdminForm, token);
                            } else {
                              await api("/api/admin/users", "POST", userAdminForm, token);
                            }
                            await loadCore();
                            setEditingUserId(null);
                            setUserAdminForm({ first_name: "", last_name: "", email: "", role: "User", is_active: true });
                          } catch (e) { setError(e.message); }
                        }}>{editingUserId ? "Save User" : "Add User"}</button>
                        <button style={styles.secondaryBtn} onClick={() => { setEditingUserId(null); setUserAdminForm({ first_name: "", last_name: "", email: "", role: "User", is_active: true }); }}>Clear</button>
                      </div>
                      <div style={{ marginTop: 10, color: "#64748B", fontSize: 13 }}>
                        New users are created with username = email and default password = <strong>1Password!</strong>
                      </div>
                    </div>

                    <div style={styles.tableWrap}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>First Name</th>
                            <th style={styles.th}>Last Name</th>
                            <th style={styles.th}>Email</th>
                            <th style={styles.th}>Authority</th>
                            <th style={styles.th}>Active</th>
                            <th style={styles.th}>Must Change Password</th>
                            <th style={styles.th}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allUsers.map((u) => (
                            <tr key={u.id}>
                              <td style={styles.td}>{u.first_name}</td>
                              <td style={styles.td}>{u.last_name}</td>
                              <td style={styles.td}>{u.email}</td>
                              <td style={styles.td}>{u.role}</td>
                              <td style={styles.td}>
                                <select
                                  style={styles.smallSelect}
                                  value={u.is_active ? "Yes" : "No"}
                                  onChange={async (e) => {
                                    try {
                                      await api(`/api/admin/users/${u.id}/status`, "PATCH", { is_active: e.target.value === "Yes" }, token);
                                      await loadCore();
                                    } catch (e) { setError(e.message); }
                                  }}
                                >
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </td>
                              <td style={styles.td}>{u.must_change_password ? "Yes" : "No"}</td>
                              <td style={styles.td}>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <button style={styles.secondaryBtn} onClick={() => {
                                    setEditingUserId(u.id);
                                    setUserAdminForm({
                                      first_name: u.first_name || "",
                                      last_name: u.last_name || "",
                                      email: u.email || "",
                                      role: u.role || "User",
                                      is_active: !!u.is_active,
                                    });
                                  }}>Edit</button>
                                  <button style={styles.secondaryBtn} onClick={async () => {
                                    try {
                                      await api(`/api/admin/users/${u.id}/reset-password`, "POST", {}, token);
                                      await loadCore();
                                    } catch (e) { setError(e.message); }
                                  }}>Reset Password</button>
                                  <button style={styles.dangerBtn} onClick={async () => {
                                    const confirmed = window.confirm("You're about to delete this record. Do you want to continue?");
                                    if (!confirmed) return;
                                    try {
                                      await api(`/api/admin/users/${u.id}`, "DELETE", null, token);
                                      await loadCore();
                                    } catch (e) { setError(e.message); }
                                  }}>Delete</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {allUsers.length === 0 ? <tr><td style={styles.td} colSpan={7}>No users yet.</td></tr> : null}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <h2 style={styles.title}>Audit Log</h2>
                    <p style={styles.subtitle}>Date and time stamped system changes with initiating user ID context.</p>
                  </div>
                  <div style={styles.cardBody}>
                    <div style={styles.tableWrap}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Date/Time</th>
                            <th style={styles.th}>Event</th>
                            <th style={styles.th}>User</th>
                            <th style={styles.th}>User ID</th>
                            <th style={styles.th}>Detail</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditEvents.map((a) => (
                            <tr key={a.id}>
                              <td style={styles.td}>{String(a.created_at).replace("T", " ").slice(0, 19)}</td>
                              <td style={styles.td}>{a.event_type}</td>
                              <td style={styles.td}>{a.actor_name || a.actor_email || "System"}</td>
                              <td style={styles.td}>{a.detail?.changed_by_user_id || a.detail?.user_id || ""}</td>
                              <td style={styles.td}><pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{JSON.stringify(a.detail)}</pre></td>
                            </tr>
                          ))}
                          {auditEvents.length === 0 ? <tr><td style={styles.td} colSpan={5}>No audit records yet.</td></tr> : null}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "sources" && isAdmin && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
            {Object.entries(sourceGroups).map(([title, items]) => (
              <SourceSection
                key={title}
                title={title}
                items={items}
                canEdit={true}
                onAdd={async ({ name, url }) => {
                  try {
                    const created = await api("/api/sources", "POST", { category: title, name, url, is_derived: false }, token);
                    setSources((prev) => [...prev, created]);
                  } catch (e) { setError(e.message); }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
