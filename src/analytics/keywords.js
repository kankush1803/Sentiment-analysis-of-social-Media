/**
 * SocialSentinel — Keyword Extraction
 * Extracts top meaningful keywords using explainable TF-IDF scoring and stopword filtering.
 */

import { preprocessText } from '../nlp/preprocess.js';
import { TfidfVectorizer } from '../nlp/vectorizer.js';

export const STOPWORDS = new Set([
  "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your",
  "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she",
  "her", "hers", "herself", "it", "its", "itself", "they", "them", "their",
  "theirs", "themselves", "what", "which", "who", "whom", "this", "that",
  "these", "those", "am", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an",
  "the", "and", "but", "if", "or", "because", "as", "until", "while", "of",
  "at", "by", "for", "with", "about", "against", "between", "into", "through",
  "during", "before", "after", "above", "below", "to", "from", "up", "down",
  "in", "out", "on", "off", "over", "under", "again", "further", "then",
  "once", "here", "there", "when", "where", "why", "how", "all", "any",
  "both", "each", "few", "more", "most", "other", "some", "such", "no",
  "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s",
  "t", "can", "will", "just", "don", "should", "now", "d", "ll", "m", "o",
  "re", "ve", "y", "ain", "aren", "couldn", "didn", "doesn", "hadn", "hasn",
  "haven", "isn", "ma", "mightn", "mustn", "needn", "shan", "shouldn", "wasn",
  "weren", "won", "wouldn", "get", "got", "also", "one", "day", "even"
]);

/**
 * Extract top N keywords with their mean TF-IDF relevance score across a list of texts.
 *
 * @param {string[]} texts
 * @param {number} topN
 * @returns {Array<[string, number]>}
 */
export function extractKeywordsFromTexts(texts, topN = 10) {
  const cleaned = texts
    .filter(t => typeof t === 'string' && t.trim().length > 0)
    .map(t => preprocessText(t))
    .filter(t => t.trim().length > 0);

  if (cleaned.length === 0) {
    return [];
  }

  const vectorizer = new TfidfVectorizer({
    stopWords: Array.from(STOPWORDS),
    maxFeatures: 50,
    ngramRange: [1, 1],
    tokenPattern: /\b[a-zA-Z]{3,}\b/g,
  });

  const sparseMatrix = vectorizer.fitTransform(cleaned);
  const numFeatures = vectorizer.featureNames.length;
  if (numFeatures === 0) {
    return [];
  }

  // Calculate mean TF-IDF score for each feature
  const sumScores = new Float64Array(numFeatures);
  for (const row of sparseMatrix) {
    for (const [featIdx, score] of row.entries()) {
      sumScores[featIdx] += score;
    }
  }

  const wordScores = [];
  for (let idx = 0; idx < numFeatures; idx++) {
    const meanScore = sumScores[idx] / cleaned.length;
    wordScores.push([vectorizer.featureNames[idx], Number(meanScore.toFixed(4))]);
  }

  wordScores.sort((a, b) => b[1] - a[1]);
  return wordScores.slice(0, topN);
}

/**
 * Extract top keywords overall, and separately for positive and negative posts.
 *
 * @param {Array<Object>} rows - Array of objects with 'text' and optional 'sentiment'
 * @param {number} topN
 * @returns {Object}
 */
export function extractKeywords(rows, topN = 10) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      overall: [],
      positive: [],
      negative: [],
    };
  }

  if (!('text' in rows[0])) {
    throw new Error("Dataset must contain a 'text' column.");
  }

  const allTexts = rows.map(r => r.text);
  const overallKeywords = extractKeywordsFromTexts(allTexts, topN);

  let posKeywords = [];
  let negKeywords = [];

  if ('sentiment' in rows[0]) {
    const posTexts = rows.filter(r => r.sentiment === 'positive').map(r => r.text);
    const negTexts = rows.filter(r => r.sentiment === 'negative').map(r => r.text);

    if (posTexts.length > 0) {
      posKeywords = extractKeywordsFromTexts(posTexts, topN);
    }
    if (negTexts.length > 0) {
      negKeywords = extractKeywordsFromTexts(negTexts, topN);
    }
  }

  return {
    overall: overallKeywords,
    positive: posKeywords,
    negative: negKeywords,
  };
}
