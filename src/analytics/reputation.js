/**
 * SocialSentinel — Reputation Score Calculator
 * Computes a transparent, project-defined brand reputation score on a 0-100 scale.
 */

import { calculateSentimentDistribution } from './statistics.js';

/**
 * Calculate an explainable reputation score between 0 and 100.
 *
 * Formula:
 *   Reputation Score = (Positive % * 1.0) + (Neutral % * 0.5) + (Negative % * 0.0)
 *
 * Status Thresholds:
 *   - 75 - 100: EXCELLENT
 *   - 60 - 74 : GOOD
 *   - 45 - 59 : AVERAGE
 *   - 30 - 44 : POOR
 *   - 0  - 29 : CRITICAL
 *
 * @param {Array<Object>} rows - Array of objects with 'sentiment'
 * @returns {Object} Reputation metrics.
 */
export function calculateReputationScore(rows) {
  const stats = calculateSentimentDistribution(rows);
  const total = stats.total;

  if (total === 0) {
    return {
      score: 50,
      status: "NO DATA",
      positive_pct: 0.0,
      neutral_pct: 0.0,
      negative_pct: 0.0,
      formula: "Score = (Positive% * 1.0) + (Neutral% * 0.5)",
    };
  }

  const posPct = stats.positive_pct;
  const neuPct = stats.neutral_pct;
  const negPct = stats.negative_pct;

  const rawScore = (posPct * 1.0) + (neuPct * 0.5);
  const score = Math.round(Math.max(0.0, Math.min(100.0, rawScore)));

  let status = "CRITICAL";
  if (score >= 75) status = "EXCELLENT";
  else if (score >= 60) status = "GOOD";
  else if (score >= 45) status = "AVERAGE";
  else if (score >= 30) status = "POOR";

  return {
    score,
    status,
    positive_pct: posPct,
    neutral_pct: neuPct,
    negative_pct: negPct,
    formula: "Score = (Positive% * 1.0) + (Neutral% * 0.5)",
  };
}
