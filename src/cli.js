/**
 * SocialSentinel — CLI Router & Command Handlers
 */

import fs from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';

import { loadCsv } from './data/loader.js';
import { validatePostsDataset } from './data/validator.js';
import { trainModel } from './nlp/train.js';
import { predictText, predictDataset } from './nlp/predictor.js';
import { calculateSentimentDistribution, analyzePlatforms } from './analytics/statistics.js';
import { extractKeywords } from './analytics/keywords.js';
import { analyzeTopics } from './analytics/topics.js';
import { analyzeTrends } from './analytics/trends.js';
import { calculateReputationScore } from './analytics/reputation.js';
import { generateAlerts } from './analytics/alerts.js';
import {
  displayTrainingResults,
  displaySingleTextAnalysis,
  displayCsvAnalysis,
  displayStats,
  displayKeywords,
  displayTopics,
  displayTrends,
  displayReputation,
  displayAlerts,
  displayPlatform,
  displayFullReport,
  displayError,
} from './reports/terminal.js';

/**
 * Helper to load, validate and run sentiment predictions on a posts CSV dataset.
 */
function loadAndPredict(filepath) {
  const rawRows = loadCsv(filepath);
  const { data: cleanedRows, warnings } = validatePostsDataset(rawRows);
  const predictedRows = predictDataset(cleanedRows);
  return { rows: predictedRows, warnings };
}

export function createCli() {
  const program = new Command();

  program
    .name('socialsentinel')
    .description('🛡️ SocialSentinel — Social Media Sentiment & Reputation Intelligence CLI')
    .version('1.0.0');

  // train
  program
    .command('train')
    .description('Train sentiment classifier on labelled CSV data')
    .argument('<file>', 'Path to training CSV (format: text,label)')
    .action((file) => {
      try {
        const results = trainModel(file);
        displayTrainingResults(results);
      } catch (err) {
        displayError(err.message);
        process.exitCode = 1;
      }
    });

  // analyze
  program
    .command('analyze')
    .description('Analyze sentiment of a single post or text')
    .argument('<text>', 'Text to classify')
    .action((text) => {
      try {
        const { sentiment, confidence } = predictText(text);
        displaySingleTextAnalysis(text, sentiment, confidence);
      } catch (err) {
        displayError(err.message);
        process.exitCode = 1;
      }
    });

  // analyze-csv
  program
    .command('analyze-csv')
    .description('Batch classify social media posts from CSV')
    .argument('<file>', 'Path to social media CSV (required: text column)')
    .option('--limit <number>', 'Maximum number of rows to display in table', (v) => parseInt(v, 10), 50)
    .action((file, options) => {
      try {
        const { rows } = loadAndPredict(file);
        displayCsvAnalysis(rows, options.limit);
      } catch (err) {
        displayError(err.message);
        process.exitCode = 1;
      }
    });

  // stats
  program
    .command('stats')
    .description('Compute sentiment distribution metrics')
    .argument('<file>', 'Path to social media posts CSV')
    .action((file) => {
      try {
        const { rows } = loadAndPredict(file);
        const stats = calculateSentimentDistribution(rows);
        displayStats(stats);
      } catch (err) {
        displayError(err.message);
        process.exitCode = 1;
      }
    });

  // keywords
  program
    .command('keywords')
    .description('Extract top keywords using TF-IDF scoring')
    .argument('<file>', 'Path to social media posts CSV')
    .option('--top <number>', 'Number of keywords to extract', (v) => parseInt(v, 10), 10)
    .action((file, options) => {
      try {
        const { rows } = loadAndPredict(file);
        const kw = extractKeywords(rows, options.top);
        displayKeywords(kw);
      } catch (err) {
        displayError(err.message);
        process.exitCode = 1;
      }
    });

  // topics
  program
    .command('topics')
    .description('Extract positive topics and negative friction points')
    .argument('<file>', 'Path to social media posts CSV')
    .option('--top <number>', 'Number of topics/issues to extract', (v) => parseInt(v, 10), 5)
    .action((file, options) => {
      try {
        const { rows } = loadAndPredict(file);
        const top = analyzeTopics(rows, options.top);
        displayTopics(top);
      } catch (err) {
        displayError(err.message);
        process.exitCode = 1;
      }
    });

  // trends
  program
    .command('trends')
    .description('Analyze sentiment changes across dates')
    .argument('<file>', 'Path to social media posts CSV (requires date column)')
    .action((file) => {
      try {
        const { rows } = loadAndPredict(file);
        const tr = analyzeTrends(rows);
        displayTrends(tr);
      } catch (err) {
        displayError(err.message);
        process.exitCode = 1;
      }
    });

  // reputation
  program
    .command('reputation')
    .description('Calculate 0-100 brand reputation intelligence score')
    .argument('<file>', 'Path to social media posts CSV')
    .action((file) => {
      try {
        const { rows } = loadAndPredict(file);
        const rep = calculateReputationScore(rows);
        displayReputation(rep);
      } catch (err) {
        displayError(err.message);
        process.exitCode = 1;
      }
    });

  // alerts
  program
    .command('alerts')
    .description('Generate automated alerts on negative spikes and risks')
    .argument('<file>', 'Path to social media posts CSV')
    .option('--negative-threshold <number>', 'Percentage threshold for negative sentiment alert', (v) => parseFloat(v), 35.0)
    .action((file, options) => {
      try {
        const { rows } = loadAndPredict(file);
        const alt = generateAlerts(rows, { negativeThreshold: options.negativeThreshold });
        displayAlerts(alt);
      } catch (err) {
        displayError(err.message);
        process.exitCode = 1;
      }
    });

  // platform
  program
    .command('platform')
    .description('Compare sentiment breakdown across social platforms')
    .argument('<file>', 'Path to social media posts CSV (requires platform column)')
    .action((file) => {
      try {
        const { rows } = loadAndPredict(file);
        const plt = analyzePlatforms(rows);
        displayPlatform(plt);
      } catch (err) {
        displayError(err.message);
        process.exitCode = 1;
      }
    });

  // report
  program
    .command('report')
    .description('Generate comprehensive terminal executive intelligence report')
    .argument('<file>', 'Path to social media posts CSV')
    .option('--json <path>', 'Optional filepath to export report in JSON format')
    .action((file, options) => {
      try {
        const { rows } = loadAndPredict(file);
        const stats = calculateSentimentDistribution(rows);
        const rep = calculateReputationScore(rows);
        const kw = extractKeywords(rows, 5);
        const top = analyzeTopics(rows, 5);
        const tr = analyzeTrends(rows);
        const plt = analyzePlatforms(rows);
        const alt = generateAlerts(rows);

        displayFullReport({
          filepath: file,
          rows,
          stats,
          reputation: rep,
          keywords: kw,
          topics: top,
          trends: tr,
          platformData: plt,
          alerts: alt,
        });

        if (options.json) {
          const exportData = {
            file,
            total_posts: rows.length,
            statistics: stats,
            reputation: rep,
            keywords: kw,
            topics: top,
            trends: tr,
            platforms: plt,
            alerts: alt,
          };
          const resolvedJson = path.resolve(options.json);
          fs.writeFileSync(resolvedJson, JSON.stringify(exportData, null, 2), 'utf8');
          console.log(`Report exported to JSON: ${resolvedJson}`);
        }
      } catch (err) {
        displayError(err.message);
        process.exitCode = 1;
      }
    });

  return program;
}
