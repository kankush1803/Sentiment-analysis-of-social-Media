import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSentimentDistribution, analyzePlatforms } from '../src/analytics/statistics.js';
import { extractKeywords } from '../src/analytics/keywords.js';
import { analyzeTopics } from '../src/analytics/topics.js';
import { analyzeTrends } from '../src/analytics/trends.js';
import { calculateReputationScore } from '../src/analytics/reputation.js';
import { generateAlerts } from '../src/analytics/alerts.js';

describe('Analytics Modules', () => {
  const samplePosts = [
    { text: 'Great service and fast delivery', sentiment: 'positive', confidence: 0.95, date: '2026-01-01', platform: 'Twitter' },
    { text: 'Love the app quality', sentiment: 'positive', confidence: 0.88, date: '2026-01-01', platform: 'Twitter' },
    { text: 'Customer support was unhelpful and slow', sentiment: 'negative', confidence: 0.91, date: '2026-01-02', platform: 'Instagram' },
    { text: 'Order status updated', sentiment: 'neutral', confidence: 0.70, date: '2026-01-02', platform: 'Instagram' },
    { text: 'Terrible crash on launch', sentiment: 'negative', confidence: 0.85, date: '2026-01-03', platform: 'Twitter' },
  ];

  test('calculateSentimentDistribution computes counts and percentages', () => {
    const stats = calculateSentimentDistribution(samplePosts);
    assert.equal(stats.total, 5);
    assert.equal(stats.positive, 2);
    assert.equal(stats.negative, 2);
    assert.equal(stats.neutral, 1);
    assert.equal(stats.positive_pct, 40.0);
    assert.equal(stats.negative_pct, 40.0);
    assert.equal(stats.neutral_pct, 20.0);
    assert.ok(stats.avg_confidence > 80);
  });

  test('calculateReputationScore computes 0-100 score and tier', () => {
    const rep = calculateReputationScore(samplePosts);
    // (40 * 1.0) + (20 * 0.5) = 50 -> AVERAGE
    assert.equal(rep.score, 50);
    assert.equal(rep.status, 'AVERAGE');
  });

  test('extractKeywords finds top relevant words', () => {
    const kw = extractKeywords(samplePosts, 5);
    assert.ok(Array.isArray(kw.overall));
    assert.ok(Array.isArray(kw.positive));
    assert.ok(Array.isArray(kw.negative));
  });

  test('analyzeTopics finds positive and negative phrases', () => {
    const topics = analyzeTopics(samplePosts, 3);
    assert.ok(Array.isArray(topics.positive_topics));
    assert.ok(Array.isArray(topics.negative_issues));
  });

  test('analyzeTrends produces date timeline and trajectory', () => {
    const trends = analyzeTrends(samplePosts);
    assert.equal(trends.has_date, true);
    assert.equal(trends.timeline.length, 3);
    assert.ok(['IMPROVING', 'DECLINING', 'STABLE'].includes(trends.overall_trend));
  });

  test('analyzePlatforms groups by social platform', () => {
    const plt = analyzePlatforms(samplePosts);
    assert.equal(plt.has_platform, true);
    assert.equal(plt.platforms.length, 2);
    assert.equal(plt.platforms[0].platform, 'Twitter');
  });

  test('generateAlerts detects negative threshold risks', () => {
    const alerts = generateAlerts(samplePosts, { negativeThreshold: 30.0 });
    assert.ok(alerts.length > 0);
    assert.ok(alerts.some(a => a.level === 'MEDIUM' || a.level === 'HIGH'));
  });
});
