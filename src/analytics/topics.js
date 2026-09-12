/**
 * SocialSentinel — Topic & Issue Analysis
 * Lightweight, explainable topic and issue identification using n-grams and sentiment associations.
 */

import { preprocessText } from '../nlp/preprocess.js';
import { STOPWORDS } from './keywords.js';

/**
 * Extract unigram and bigram phrases from texts.
 *
 * @param {string[]} texts
 * @param {number} minLength
 * @param {number} maxLength
 * @returns {Map<string, number>}
 */
function extractPhrases(texts, minLength = 1, maxLength = 2) {
  const phraseCounts = new Map();

  for (const text of texts) {
    const clean = preprocessText(text);
    const tokens = (clean.match(/\b[a-zA-Z]{3,}\b/g) || []).filter(w => !STOPWORDS.has(w));

    // Unigrams
    if (minLength <= 1 && 1 <= maxLength) {
      for (const t of tokens) {
        phraseCounts.set(t, (phraseCounts.get(t) || 0) + 1);
      }
    }

    // Bigrams
    if (minLength <= 2 && 2 <= maxLength) {
      for (let i = 0; i < tokens.length - 1; i++) {
        const bg = `${tokens[i]} ${tokens[i + 1]}`;
        phraseCounts.set(bg, (phraseCounts.get(bg) || 0) + 1);
      }
    }
  }

  return phraseCounts;
}

/**
 * Identify key positive topics and negative issues from social media posts.
 *
 * @param {Array<Object>} rows - Array of objects with 'text' and optional 'sentiment'
 * @param {number} topN
 * @returns {{ positive_topics: Array<[string, number]>, negative_issues: Array<[string, number]> }}
 */
export function analyzeTopics(rows, topN = 5) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      positive_topics: [],
      negative_issues: [],
    };
  }

  if (!('text' in rows[0])) {
    throw new Error("Dataset must contain a 'text' column.");
  }

  let posTexts = [];
  let negTexts = [];

  if ('sentiment' in rows[0]) {
    posTexts = rows.filter(r => r.sentiment === 'positive').map(r => r.text);
    negTexts = rows.filter(r => r.sentiment === 'negative').map(r => r.text);
  } else {
    posTexts = rows.map(r => r.text);
  }

  const posCounts = extractPhrases(posTexts);
  const negCounts = extractPhrases(negTexts);

  const sortedPos = Array.from(posCounts.entries()).sort((a, b) => b[1] - a[1]);
  const sortedNeg = Array.from(negCounts.entries()).sort((a, b) => b[1] - a[1]);

  const positiveTopics = sortedPos.slice(0, topN);
  const negativeIssues = sortedNeg.slice(0, topN);

  return {
    positive_topics: positiveTopics,
    negative_issues: negativeIssues,
  };
}
