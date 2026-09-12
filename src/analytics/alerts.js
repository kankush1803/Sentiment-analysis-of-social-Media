/**
 * SocialSentinel — Alert System
 * Generates rule-based alerts based on negative sentiment volume, reputation risks, and trends.
 */

import { calculateSentimentDistribution } from './statistics.js';
import { calculateReputationScore } from './reputation.js';
import { analyzeTrends } from './trends.js';

/**
 * Evaluate dataset sentiment metrics and produce actionable alerts.
 *
 * @param {Array<Object>} rows
 * @param {Object} options
 * @param {number} [options.negativeThreshold=35.0]
 * @param {number} [options.criticalThreshold=50.0]
 * @returns {Array<{ level: "HIGH"|"MEDIUM"|"LOW"|"INFO", message: string }>}
 */
export function generateAlerts(rows, options = {}) {
  const negativeThreshold = options.negativeThreshold ?? 35.0;
  const criticalThreshold = options.criticalThreshold ?? 50.0;

  const alerts = [];
  const stats = calculateSentimentDistribution(rows);
  const total = stats.total;

  if (total === 0) {
    return [{ level: "INFO", message: "No posts to analyze for alerts." }];
  }

  const negPct = stats.negative_pct;

  // 1. Critical/High Negative Sentiment Threshold
  if (negPct >= criticalThreshold) {
    alerts.push({
      level: "HIGH",
      message: `Critical negative sentiment detected: ${negPct}% of posts are negative (Threshold: ${criticalThreshold}%).`,
    });
  } else if (negPct >= negativeThreshold) {
    alerts.push({
      level: "MEDIUM",
      message: `Elevated negative sentiment: ${negPct}% of posts are negative (Threshold: ${negativeThreshold}%).`,
    });
  }

  // 2. Reputation Score Alert
  const rep = calculateReputationScore(rows);
  if (rep.score < 30) {
    alerts.push({
      level: "HIGH",
      message: `Critical reputation status (${rep.score}/100 - ${rep.status}). Immediate brand intervention recommended.`,
    });
  } else if (rep.score < 45) {
    alerts.push({
      level: "MEDIUM",
      message: `Low reputation score (${rep.score}/100 - ${rep.status}). Customer dissatisfaction is notable.`,
    });
  }

  // 3. Sentiment Trend Alert
  if (rows.length > 0 && 'date' in rows[0]) {
    const trendData = analyzeTrends(rows);
    if (trendData.overall_trend === "DECLINING") {
      alerts.push({
        level: "MEDIUM",
        message: "Sentiment trend is DECLINING over recent dates. Negative feedback is increasing.",
      });
    }
  }

  // 4. Platform-Specific Negative Outlier Alert
  if (rows.length > 0 && 'platform' in rows[0]) {
    const validPlatformRows = rows.filter(r => r.platform && String(r.platform).trim().length > 0);
    const groups = new Map();
    for (const r of validPlatformRows) {
      const p = String(r.platform).trim();
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p).push(r);
    }

    for (const [platformName, pRows] of groups.entries()) {
      const pStats = calculateSentimentDistribution(pRows);
      if (pStats.total >= 5 && pStats.negative_pct >= 50.0) {
        alerts.push({
          level: "HIGH",
          message: `Platform '${platformName}' has a severe negative concentration: ${pStats.negative_pct}% negative posts.`,
        });
      }
    }
  }

  if (alerts.length === 0) {
    alerts.push({
      level: "INFO",
      message: "No critical sentiment risks or negative spikes detected.",
    });
  }

  return alerts;
}
