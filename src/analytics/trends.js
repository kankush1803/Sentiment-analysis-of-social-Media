/**
 * SocialSentinel — Trend Analysis
 * Computes time-series sentiment progression and determines trend direction.
 */

/**
 * Analyze sentiment trends across time.
 *
 * @param {Array<Object>} rows - Array of objects with 'sentiment' and optional 'date'.
 * @returns {Object} Trend metrics and timeline.
 */
export function analyzeTrends(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      has_date: false,
      timeline: [],
      overall_trend: "INSUFFICIENT_DATA",
      message: "No data available for trend analysis.",
    };
  }

  const hasDate = 'date' in rows[0];
  if (!hasDate) {
    return {
      has_date: false,
      timeline: [],
      overall_trend: "INSUFFICIENT_DATA",
      message: "Dataset does not contain a 'date' column. Trend analysis requires dates.",
    };
  }

  const validRows = rows.filter(r => r.date && String(r.date).trim().length > 0);
  if (validRows.length === 0) {
    return {
      has_date: false,
      timeline: [],
      overall_trend: "INSUFFICIENT_DATA",
      message: "No valid dates found in the 'date' column.",
    };
  }

  // Group by date
  const dateGroups = new Map();
  for (const r of validRows) {
    let dateStr = String(r.date).trim();
    // Normalize date string if needed
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      dateStr = parsed.toISOString().slice(0, 10);
    }

    if (!dateGroups.has(dateStr)) {
      dateGroups.set(dateStr, { positive: 0, negative: 0, neutral: 0, total: 0 });
    }

    const grp = dateGroups.get(dateStr);
    const s = String(r.sentiment || '').toLowerCase();
    if (s === 'positive') grp.positive++;
    else if (s === 'negative') grp.negative++;
    else grp.neutral++;
    grp.total++;
  }

  const sortedDates = Array.from(dateGroups.keys()).sort();
  const timeline = [];

  for (const d of sortedDates) {
    const grp = dateGroups.get(d);
    const net = grp.total > 0 ? (grp.positive - grp.negative) / grp.total : 0.0;
    timeline.push({
      date: d,
      positive: grp.positive,
      negative: grp.negative,
      neutral: grp.neutral,
      total: grp.total,
      net_sentiment: Number(net.toFixed(3)),
    });
  }

  if (timeline.length < 2) {
    return {
      has_date: true,
      timeline,
      overall_trend: "STABLE",
      message: "Fewer than 2 time points available. Trend is considered stable.",
    };
  }

  // Compare first half vs second half
  const mid = Math.floor(timeline.length / 2);
  const firstHalf = timeline.slice(0, mid);
  const secondHalf = timeline.slice(mid);

  const firstHalfNet = firstHalf.reduce((sum, t) => sum + t.net_sentiment, 0) / firstHalf.length;
  const secondHalfNet = secondHalf.reduce((sum, t) => sum + t.net_sentiment, 0) / secondHalf.length;

  const diff = secondHalfNet - firstHalfNet;

  let overallTrend = "STABLE";
  if (diff >= 0.15) {
    overallTrend = "IMPROVING";
  } else if (diff <= -0.15) {
    overallTrend = "DECLINING";
  }

  return {
    has_date: true,
    timeline,
    overall_trend: overallTrend,
    message: `Trend analyzed across ${timeline.length} distinct dates.`,
  };
}
