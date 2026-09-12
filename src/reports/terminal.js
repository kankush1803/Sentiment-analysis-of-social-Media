/**
 * SocialSentinel — Terminal Report Formatter
 * Handles visual output formatting, Unicode bar charts, tables, panels, and executive reports.
 */

import chalk from 'chalk';
import Table from 'cli-table3';

/**
 * Color mapping for sentiment values.
 */
export function getSentimentColor(sentiment) {
  const s = String(sentiment).toLowerCase();
  if (s === 'positive') return chalk.green.bold;
  if (s === 'negative') return chalk.red.bold;
  return chalk.yellow.bold;
}

/**
 * Generate Unicode progress bar.
 */
export function makeBar(percentage, width = 20, fillChar = '█', emptyChar = '░') {
  const filled = Math.round((Math.max(0, Math.min(100, percentage)) / 100.0) * width);
  return fillChar.repeat(filled) + emptyChar.repeat(Math.max(0, width - filled));
}

/**
 * Create a stylized box/panel around text.
 */
function makePanel(title, content, borderColor = 'cyan') {
  const lines = content.split('\n');
  const maxLen = Math.max(
    title ? title.length + 4 : 0,
    ...lines.map(l => l.replace(/\u001b\[[0-9;]*m/g, '').length)
  ) + 4;

  const colorFn = chalk[borderColor] || chalk.cyan;
  const topBorder = colorFn('╭─' + (title ? ` ${title} ` : '') + '─'.repeat(Math.max(0, maxLen - (title ? title.length + 4 : 2))) + '╮');
  const bottomBorder = colorFn('╰' + '─'.repeat(maxLen) + '╯');

  const paddedLines = lines.map(line => {
    const rawLen = line.replace(/\u001b\[[0-9;]*m/g, '').length;
    const padding = ' '.repeat(Math.max(0, maxLen - rawLen - 2));
    return colorFn('│ ') + line + padding + colorFn(' │');
  });

  return [topBorder, ...paddedLines, bottomBorder].join('\n');
}

// ---------------------------------------------------------------------------
// Display Functions
// ---------------------------------------------------------------------------

export function displayTrainingResults(results) {
  console.log();
  const title = chalk.cyan.bold('🎯 Model Training Complete');
  const body = [
    `${chalk.bold('Model Type:')} TF-IDF Vectorizer + Logistic Regression (Multinomial)`,
    `${chalk.bold('Total Samples:')} ${results.total_samples} (Train: ${results.train_size}, Test: ${results.test_size})`,
    `${chalk.bold('Accuracy Achieved:')} ${chalk.green.bold((results.accuracy * 100).toFixed(2) + '%')}`,
    `${chalk.bold('Model Artifact:')} ${results.model_path}`,
    '',
    `${chalk.bold('Classification Report:')}`,
    results.report,
  ].join('\n');

  console.log(makePanel(title, body, 'cyan'));

  if (results.warnings && results.warnings.length > 0) {
    for (const w of results.warnings) {
      console.log(chalk.yellow(`⚠ Warning: ${w}`));
    }
  }
  console.log();
}

export function displaySingleTextAnalysis(text, sentiment, confidence) {
  console.log();
  const sUpper = sentiment.toUpperCase();
  const colorFn = getSentimentColor(sentiment);

  let interp = '';
  if (sentiment.toLowerCase() === 'positive') {
    interp = 'The text expresses a positive opinion, satisfaction, or praise.';
  } else if (sentiment.toLowerCase() === 'negative') {
    interp = 'The text expresses dissatisfaction, complaint, or negative emotion.';
  } else {
    interp = 'The text is factual, neutral, or does not carry strong polarity.';
  }

  const content = [
    `${chalk.bold('Text:')}\n"${text}"\n`,
    `${chalk.bold('Sentiment:')} ${colorFn(sUpper)}`,
    `${chalk.bold('Confidence:')} ${chalk.cyan.bold((confidence * 100).toFixed(2) + '%')}\n`,
    `${chalk.bold('Interpretation:')}\n${interp}`,
  ].join('\n');

  console.log(makePanel(chalk.blue.bold('🛡️ SocialSentinel Analysis'), content, 'blue'));
  console.log();
}

export function displayCsvAnalysis(rows, maxRows = 50) {
  console.log();
  const table = new Table({
    head: [
      chalk.magenta.bold('ID'),
      chalk.magenta.bold('Sentiment'),
      chalk.magenta.bold('Confidence'),
      chalk.magenta.bold('Text')
    ],
    colWidths: [8, 14, 14, 60],
    wordWrap: true,
  });

  const displaySlice = rows.slice(0, maxRows);
  for (let idx = 0; idx < displaySlice.length; idx++) {
    const row = displaySlice[idx];
    const rowId = row.id || String(idx + 1);
    const sentiment = String(row.sentiment || 'neutral').toUpperCase();
    const colorFn = getSentimentColor(sentiment);
    const confVal = row.confidence !== undefined ? (Number(row.confidence) * 100).toFixed(1) + '%' : 'N/A';
    let text = String(row.text || '').replace(/\n/g, ' ');
    if (text.length > 80) {
      text = text.slice(0, 77) + '...';
    }

    table.push([
      chalk.dim(rowId),
      colorFn(sentiment),
      chalk.cyan(confVal),
      text
    ]);
  }

  console.log(chalk.bold.magenta('📊 Social Media Posts Sentiment Predictions'));
  console.log(table.toString());
  if (rows.length > maxRows) {
    console.log(chalk.dim(`\n... Showing ${maxRows} of ${rows.length} total posts. Use --limit to adjust.`));
  }
  console.log();
}

export function displayStats(stats) {
  console.log();
  const table = new Table({
    head: [
      chalk.cyan.bold('Sentiment'),
      chalk.cyan.bold('Count'),
      chalk.cyan.bold('Percentage'),
      chalk.cyan.bold('Distribution Visual')
    ],
    colWidths: [14, 10, 14, 30],
  });

  table.push(
    [
      chalk.green.bold('Positive'),
      stats.positive,
      `${stats.positive_pct}%`,
      chalk.green(makeBar(stats.positive_pct, 20))
    ],
    [
      chalk.yellow.bold('Neutral'),
      stats.neutral,
      `${stats.neutral_pct}%`,
      chalk.yellow(makeBar(stats.neutral_pct, 20))
    ],
    [
      chalk.red.bold('Negative'),
      stats.negative,
      `${stats.negative_pct}%`,
      chalk.red(makeBar(stats.negative_pct, 20))
    ]
  );

  console.log(chalk.bold.cyan('📊 Sentiment Distribution Statistics'));
  console.log(table.toString());
  console.log(
    `Total Posts: ${chalk.bold(stats.total)}  |  Dominant Tone: ${getSentimentColor(stats.dominant)(stats.dominant.toUpperCase())}` +
    (stats.avg_confidence ? `  |  Avg Confidence: ${chalk.cyan.bold(stats.avg_confidence + '%')}` : '')
  );
  console.log();
}

export function displayKeywords(keywords) {
  console.log();
  console.log(chalk.bold.yellow('🔑 TF-IDF Keyword Intelligence'));

  const table = new Table({
    head: [
      chalk.yellow.bold('Rank'),
      chalk.yellow.bold('Overall Keywords'),
      chalk.green.bold('Positive Drivers'),
      chalk.red.bold('Negative Drivers')
    ],
    colWidths: [8, 25, 25, 25],
  });

  const maxLen = Math.max(
    keywords.overall.length,
    keywords.positive.length,
    keywords.negative.length
  );

  for (let i = 0; i < maxLen; i++) {
    const ov = keywords.overall[i] ? `${keywords.overall[i][0]} (${keywords.overall[i][1]})` : '-';
    const pos = keywords.positive[i] ? `${keywords.positive[i][0]} (${keywords.positive[i][1]})` : '-';
    const neg = keywords.negative[i] ? `${keywords.negative[i][0]} (${keywords.negative[i][1]})` : '-';

    table.push([`#${i + 1}`, ov, chalk.green(pos), chalk.red(neg)]);
  }

  console.log(table.toString());
  console.log();
}

export function displayTopics(topics) {
  console.log();
  console.log(chalk.bold.magenta('💡 Topic & Issue Discovery'));

  const table = new Table({
    head: [
      chalk.magenta.bold('Rank'),
      chalk.green.bold('Top Positive Topics'),
      chalk.red.bold('Top Negative Issues')
    ],
    colWidths: [8, 38, 38],
  });

  const maxLen = Math.max(topics.positive_topics.length, topics.negative_issues.length);
  for (let i = 0; i < maxLen; i++) {
    const pos = topics.positive_topics[i] ? `"${topics.positive_topics[i][0]}" (${topics.positive_topics[i][1]} mentions)` : '-';
    const neg = topics.negative_issues[i] ? `"${topics.negative_issues[i][0]}" (${topics.negative_issues[i][1]} mentions)` : '-';

    table.push([`#${i + 1}`, chalk.green(pos), chalk.red(neg)]);
  }

  console.log(table.toString());
  console.log();
}

export function displayTrends(trends) {
  console.log();
  console.log(chalk.bold.blue('📈 Time-Series Sentiment Progression'));

  if (!trends.has_date || trends.timeline.length === 0) {
    console.log(chalk.yellow(trends.message));
    console.log();
    return;
  }

  const table = new Table({
    head: [
      chalk.blue.bold('Date'),
      chalk.green.bold('Pos'),
      chalk.yellow.bold('Neu'),
      chalk.red.bold('Neg'),
      chalk.cyan.bold('Total'),
      chalk.bold('Net Score'),
      chalk.bold('Net Trajectory')
    ],
    colWidths: [14, 8, 8, 8, 10, 12, 24],
  });

  for (const t of trends.timeline) {
    const net = t.net_sentiment;
    const netColor = net > 0 ? chalk.green : net < 0 ? chalk.red : chalk.yellow;
    const netBar = net >= 0 ? chalk.green('+' + makeBar(net * 100, 10)) : chalk.red('-' + makeBar(Math.abs(net) * 100, 10));

    table.push([
      t.date,
      chalk.green(t.positive),
      chalk.yellow(t.neutral),
      chalk.red(t.negative),
      t.total,
      netColor(net > 0 ? `+${net.toFixed(2)}` : net.toFixed(2)),
      netBar
    ]);
  }

  console.log(table.toString());

  const trendColor = trends.overall_trend === 'IMPROVING' ? chalk.green.bold : trends.overall_trend === 'DECLINING' ? chalk.red.bold : chalk.yellow.bold;
  console.log(`Overall Trend Trajectory: ${trendColor(trends.overall_trend)} (${trends.message})`);
  console.log();
}

export function displayReputation(rep) {
  console.log();
  const statusColor = rep.status === 'EXCELLENT' ? chalk.green.bold :
    rep.status === 'GOOD' ? chalk.cyan.bold :
    rep.status === 'AVERAGE' ? chalk.yellow.bold :
    rep.status === 'POOR' ? chalk.magenta.bold : chalk.red.bold;

  const content = [
    `${chalk.bold('Brand Score:')} ${statusColor(rep.score + ' / 100')}  [${statusColor(rep.status)}]`,
    `${chalk.bold('Score Visual:')} ${statusColor(makeBar(rep.score, 30))}`,
    '',
    `${chalk.bold('Sentiment Breakdown:')} Positive: ${chalk.green(rep.positive_pct + '%')} | Neutral: ${chalk.yellow(rep.neutral_pct + '%')} | Negative: ${chalk.red(rep.negative_pct + '%')}`,
    `${chalk.dim('Formula: ' + rep.formula)}`,
  ].join('\n');

  console.log(makePanel(chalk.bold.cyan('🏆 Brand Reputation Index'), content, 'cyan'));
  console.log();
}

export function displayAlerts(alerts) {
  console.log();
  console.log(chalk.bold.red('🚨 Sentinel Risk Monitoring & Alerts'));

  for (const a of alerts) {
    let prefix = chalk.blue('[INFO]');
    if (a.level === 'HIGH') prefix = chalk.red.bold('[HIGH RISK]');
    else if (a.level === 'MEDIUM') prefix = chalk.yellow.bold('[MEDIUM RISK]');
    else if (a.level === 'LOW') prefix = chalk.cyan('[LOW]');

    console.log(`  ${prefix} ${a.message}`);
  }
  console.log();
}

export function displayPlatform(platformData) {
  console.log();
  console.log(chalk.bold.magenta('🌐 Cross-Platform Sentiment Breakdown'));

  if (!platformData.has_platform || platformData.platforms.length === 0) {
    console.log(chalk.yellow(platformData.message));
    console.log();
    return;
  }

  const table = new Table({
    head: [
      chalk.magenta.bold('Platform'),
      chalk.magenta.bold('Volume'),
      chalk.green.bold('Positive %'),
      chalk.yellow.bold('Neutral %'),
      chalk.red.bold('Negative %'),
      chalk.bold('Dominant Tone')
    ],
    colWidths: [16, 10, 14, 14, 14, 16],
  });

  for (const p of platformData.platforms) {
    table.push([
      chalk.bold(p.platform),
      p.total,
      chalk.green(`${p.positive_pct}%`),
      chalk.yellow(`${p.neutral_pct}%`),
      chalk.red(`${p.negative_pct}%`),
      getSentimentColor(p.dominant)(p.dominant.toUpperCase())
    ]);
  }

  console.log(table.toString());
  console.log();
}

export function displayFullReport(options) {
  const {
    filepath,
    rows,
    stats,
    reputation,
    keywords,
    topics,
    trends,
    platformData,
    alerts
  } = options;

  console.log();
  console.log(chalk.bold.cyan('════════════════════════════════════════════════════════════════════════════'));
  console.log(chalk.bold.cyan('           🛡️  SOCIALSENTINEL EXECUTIVE INTELLIGENCE DASHBOARD            '));
  console.log(chalk.bold.cyan('════════════════════════════════════════════════════════════════════════════'));
  console.log(chalk.dim(`  Dataset: ${filepath} | Total Posts Analyzed: ${rows.length}`));

  displayReputation(reputation);
  displayStats(stats);
  displayAlerts(alerts);
  displayKeywords(keywords);
  displayTopics(topics);
  if (trends.has_date) {
    displayTrends(trends);
  }
  if (platformData.has_platform) {
    displayPlatform(platformData);
  }

  console.log(chalk.bold.cyan('════════════════════════════════════════════════════════════════════════════'));
  console.log(chalk.green.bold('  ✔ Executive Report Generation Complete'));
  console.log(chalk.bold.cyan('════════════════════════════════════════════════════════════════════════════\n'));
}

export function displayError(message) {
  console.error();
  console.error(chalk.red.bold('✖ Error:'), chalk.red(message));
  console.error();
}
