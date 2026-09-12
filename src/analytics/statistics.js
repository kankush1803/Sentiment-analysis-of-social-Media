/**
 * SocialSentinel — Sentiment Statistics
 * Calculates distribution, percentages, and dominant sentiment.
 */

/**
 * Compute sentiment distribution statistics from an array of predicted row objects.
 *
 * @param {Array<Object>} rows - Array of objects with 'sentiment' and optional 'confidence'.
 * @returns {Object} Statistics summary.
 */
export function calculateSentimentDistribution(rows) {
  if (!Array.isArray(rows)) {
    throw new Error("Input must be an array of rows.");
  }

  const total = rows.length;
  if (total === 0) {
    return {
      total: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      positive_pct: 0.0,
      negative_pct: 0.0,
      neutral_pct: 0.0,
      dominant: 'neutral',
      avg_confidence: null,
    };
  }

  let pos = 0;
  let neg = 0;
  let neu = 0;
  let confSum = 0;
  let confCount = 0;

  for (const r of rows) {
    const s = String(r.sentiment || '').toLowerCase();
    if (s === 'positive') pos++;
    else if (s === 'negative') neg++;
    else neu++;

    if (r.confidence !== undefined && r.confidence !== null && !isNaN(r.confidence)) {
      confSum += Number(r.confidence);
      confCount++;
    }
  }

  const pct = (n) => Number(((n / total) * 100).toFixed(1));

  let dominant = 'neutral';
  if (pos > neg && pos >= neu) dominant = 'positive';
  else if (neg > pos && neg >= neu) dominant = 'negative';
  else if (neu >= pos && neu >= neg) dominant = 'neutral';

  const avgConf = confCount > 0 ? Number(((confSum / confCount) * 100).toFixed(1)) : null;

  return {
    total,
    positive: pos,
    negative: neg,
    neutral: neu,
    positive_pct: pct(pos),
    negative_pct: pct(neg),
    neutral_pct: pct(neu),
    dominant,
    avg_confidence: avgConf,
  };
}

/**
 * Compare sentiment distributions across different social media platforms.
 *
 * @param {Array<Object>} rows - Array of objects with 'sentiment' and optional 'platform'.
 * @returns {Object}
 */
export function analyzePlatforms(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      has_platform: false,
      platforms: [],
      message: "No data available for platform analysis.",
    };
  }

  const hasPlatformCol = 'platform' in rows[0];
  if (!hasPlatformCol) {
    return {
      has_platform: false,
      platforms: [],
      message: "Dataset does not contain a 'platform' column. Platform comparison unavailable.",
    };
  }

  const validRows = rows.filter(r => r.platform && String(r.platform).trim().length > 0);
  if (validRows.length === 0) {
    return {
      has_platform: false,
      platforms: [],
      message: "No valid platform entries found in the 'platform' column.",
    };
  }

  // Group by platform
  const groups = new Map();
  for (const r of validRows) {
    const pName = String(r.platform).trim();
    if (!groups.has(pName)) {
      groups.set(pName, []);
    }
    groups.get(pName).push(r);
  }

  const platformsSummary = [];
  for (const [platformName, groupRows] of groups.entries()) {
    const stats = calculateSentimentDistribution(groupRows);
    platformsSummary.push({
      platform: platformName,
      total: stats.total,
      positive: stats.positive,
      neutral: stats.neutral,
      negative: stats.negative,
      positive_pct: stats.positive_pct,
      neutral_pct: stats.neutral_pct,
      negative_pct: stats.negative_pct,
      dominant: stats.dominant,
    });
  }

  // Sort by total volume descending
  platformsSummary.sort((a, b) => b.total - a.total);

  return {
    has_platform: true,
    platforms: platformsSummary,
    message: `Analyzed ${platformsSummary.length} platform(s).`,
  };
}
