async function getWeights(pool, workspaceId) {
  const { rows } = await pool.query(
    `select intent_weight, trigger_weight, fit_weight, confidence_weight
     from scoring_weights
     where workspace_id = $1
     limit 1`,
    [workspaceId]
  );
  if (rows[0]) return rows[0];
  return { intent_weight: 0.35, trigger_weight: 0.20, fit_weight: 0.30, confidence_weight: 0.15 };
}

function bandPriority(score) {
  if (score >= 80) return "P1";
  if (score >= 60) return "P2";
  return "P3";
}

function stageFromScore(score) {
  if (score >= 75) return "Late";
  if (score >= 50) return "Mid";
  return "Early";
}

async function recomputeAccount(pool, accountId, workspaceId) {
  const signalsResult = await pool.query(
    `select signal_type, strength, confidence
     from signals
     where account_id = $1 and workspace_id = $2`,
    [accountId, workspaceId]
  );
  const weights = await getWeights(pool, workspaceId);

  let intent = 0, trigger = 0, fit = 0, confidence = 0;
  const signalTypeMap = {
    "ERP / WMS hiring": { intent: 30, trigger: 10, fit: 10 },
    "Inventory leadership hiring": { intent: 25, trigger: 8, fit: 12 },
    "Warehouse expansion": { intent: 18, trigger: 30, fit: 16 },
    "Inventory accuracy or stock issue": { intent: 26, trigger: 10, fit: 22 },
    "Integration / API modernization": { intent: 20, trigger: 12, fit: 18 },
    "Pricing or demo page engagement": { intent: 32, trigger: 14, fit: 8 },
    "Deep solution content consumption": { intent: 24, trigger: 8, fit: 6 },
    "Fulfillment or service level issue": { intent: 22, trigger: 16, fit: 16 },
  };

  for (const s of signalsResult.rows) {
    const cfg = signalTypeMap[s.signal_type] || { intent: 10, trigger: 10, fit: 10 };
    const strengthFactor = s.strength === "Strong" ? 1 : s.strength === "Medium" ? 0.7 : 0.4;
    intent += cfg.intent * strengthFactor;
    trigger += cfg.trigger * strengthFactor;
    fit += cfg.fit * strengthFactor;
    confidence += Number(s.confidence || 0);
  }

  const count = Math.max(signalsResult.rows.length, 1);
  confidence = Math.min(100, Math.round(confidence / count));
  intent = Math.min(100, Math.round(intent));
  trigger = Math.min(100, Math.round(trigger));
  fit = Math.min(100, Math.round(fit));

  const overall = Math.round(
    intent * Number(weights.intent_weight) +
    trigger * Number(weights.trigger_weight) +
    fit * Number(weights.fit_weight) +
    confidence * Number(weights.confidence_weight)
  );

  const priority = bandPriority(overall);
  const stage = stageFromScore(overall);

  await pool.query(
    `update accounts
     set intent_score = $1,
         trigger_score = $2,
         fit_score = $3,
         confidence_score = $4,
         overall_score = $5,
         priority = $6,
         stage = $7,
         updated_at = now()
     where id = $8 and workspace_id = $9`,
    [intent, trigger, fit, confidence, overall, priority, stage, accountId, workspaceId]
  );

  return { intent, trigger, fit, confidence, overall, priority, stage };
}

module.exports = { recomputeAccount };
