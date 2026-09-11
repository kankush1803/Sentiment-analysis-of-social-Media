/**
 * SocialSentinel — Sentiment Predictor
 * Loads trained model and vectorizer from disk and performs single-text / batch prediction.
 */

import fs from 'node:fs';
import path from 'node:path';
import { preprocessText } from './preprocess.js';
import { TfidfVectorizer } from './vectorizer.js';
import { LogisticRegression } from './classifier.js';

export const MODEL_PATH = path.resolve('models/model.json');

let _vectorizer = null;
let _classifier = null;

/**
 * Return true if model file is present on disk.
 */
export function modelsExist() {
  return fs.existsSync(MODEL_PATH);
}

/**
 * Clear the module-level model cache.
 */
export function resetModels() {
  _vectorizer = null;
  _classifier = null;
}

/**
 * Load the trained model and vectorizer from disk into module cache.
 */
export function loadModels() {
  if (!fs.existsSync(MODEL_PATH)) {
    throw new Error(
      "No trained model found.\n\n" +
      "Train a model first by running:\n\n" +
      "  socialsentinel train data/training.csv"
    );
  }

  const raw = fs.readFileSync(MODEL_PATH, 'utf8');
  const parsed = JSON.parse(raw);

  _vectorizer = TfidfVectorizer.fromJSON(parsed.vectorizer);
  _classifier = LogisticRegression.fromJSON(parsed.classifier);
}

function ensureLoaded() {
  if (!_vectorizer || !_classifier) {
    loadModels();
  }
}

/**
 * Predict the sentiment of a single text string.
 *
 * @param {string} text - Raw text
 * @returns {{ sentiment: string, confidence: number }}
 */
export function predictText(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error("Input text cannot be empty.");
  }

  ensureLoaded();

  const clean = preprocessText(text);
  const sparseVecs = _vectorizer.transform([clean]);
  const probMap = _classifier.predictProba(sparseVecs)[0];

  let bestLabel = 'neutral';
  let bestScore = -1;

  for (const [label, score] of Object.entries(probMap)) {
    if (score > bestScore) {
      bestScore = score;
      bestLabel = label;
    }
  }

  return {
    sentiment: bestLabel,
    confidence: Number(bestScore.toFixed(4)),
  };
}

/**
 * Predict sentiment for an array of row objects (each containing a 'text' property).
 *
 * @param {Array<Object>} rows - Array of objects with 'text'
 * @returns {Array<Object>} Array with 'sentiment' and 'confidence' appended
 */
export function predictDataset(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  if (!('text' in rows[0])) {
    throw new Error("Dataset must contain a 'text' column.");
  }

  ensureLoaded();

  const cleanTexts = rows.map(r => preprocessText(r.text || ''));
  const sparseVecs = _vectorizer.transform(cleanTexts);
  const probas = _classifier.predictProba(sparseVecs);

  return rows.map((row, idx) => {
    const probMap = probas[idx];
    let bestLabel = 'neutral';
    let bestScore = -1;

    for (const [label, score] of Object.entries(probMap)) {
      if (score > bestScore) {
        bestScore = score;
        bestLabel = label;
      }
    }

    return {
      ...row,
      sentiment: bestLabel,
      confidence: Number(bestScore.toFixed(4)),
    };
  });
}
