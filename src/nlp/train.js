/**
 * SocialSentinel — Model Training Pipeline
 * Trains a TF-IDF + Logistic Regression sentiment classifier and serializes to JSON.
 */

import fs from 'node:fs';
import path from 'node:path';
import { loadCsv } from '../data/loader.js';
import { validateTrainingDataset } from '../data/validator.js';
import { preprocessText } from './preprocess.js';
import { TfidfVectorizer } from './vectorizer.js';
import { LogisticRegression } from './classifier.js';

export const MODELS_DIR = path.resolve('models');
export const MODEL_PATH = path.join(MODELS_DIR, 'model.json');

/**
 * Deterministic pseudo-random shuffle helper.
 */
function seededShuffle(array, seed = 42) {
  const result = [...array];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const rnd = s / 233280;
    const j = Math.floor(rnd * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate formatted classification report string.
 */
function generateClassificationReport(yTrue, yPred, labels) {
  const presentLabels = labels.filter(lb => yTrue.includes(lb));
  const metrics = {};

  for (const label of presentLabels) {
    let tp = 0;
    let fp = 0;
    let fn = 0;

    for (let i = 0; i < yTrue.length; i++) {
      if (yTrue[i] === label && yPred[i] === label) tp++;
      else if (yTrue[i] !== label && yPred[i] === label) fp++;
      else if (yTrue[i] === label && yPred[i] !== label) fn++;
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const support = yTrue.filter(y => y === label).length;

    metrics[label] = { precision, recall, f1, support };
  }

  // Header
  let report = '              precision    recall  f1-score   support\n\n';
  for (const label of presentLabels) {
    const m = metrics[label];
    const padLabel = label.padEnd(12, ' ');
    const padPrec = m.precision.toFixed(3).padStart(9, ' ');
    const padRec = m.recall.toFixed(3).padStart(9, ' ');
    const padF1 = m.f1.toFixed(3).padStart(9, ' ');
    const padSup = String(m.support).padStart(9, ' ');
    report += `${padLabel}${padPrec}${padRec}${padF1}${padSup}\n`;
  }

  let totalSupport = yTrue.length;
  let correct = yTrue.filter((y, i) => y === yPred[i]).length;
  let accuracy = totalSupport > 0 ? correct / totalSupport : 0;

  report += `\n    accuracy                         ${accuracy.toFixed(3).padStart(9, ' ')}${String(totalSupport).padStart(9, ' ')}\n`;

  return { report, accuracy };
}

/**
 * Full training pipeline: load -> validate -> preprocess -> split -> train -> evaluate -> save.
 *
 * @param {string} filepath - Path to CSV with 'text' and 'label' columns.
 * @returns {Object} Training metrics and summary.
 */
export function trainModel(filepath) {
  const rawRows = loadCsv(filepath);
  const { data, warnings } = validateTrainingDataset(rawRows);

  const cleanData = [];
  for (const row of data) {
    const cleaned = preprocessText(row.text);
    if (cleaned.length > 0) {
      cleanData.push({ text: cleaned, label: row.label });
    }
  }

  const totalSamples = cleanData.length;
  if (totalSamples < 10) {
    throw new Error('Insufficient valid text entries after preprocessing for training.');
  }

  // Train / Test split
  const shuffled = seededShuffle(cleanData, 42);
  const testFraction = totalSamples >= 30 ? 0.2 : 0.1;
  const testSize = Math.max(2, Math.round(totalSamples * testFraction));
  const trainSize = totalSamples - testSize;

  const trainSet = shuffled.slice(0, trainSize);
  const testSet = shuffled.slice(trainSize);

  const XTrainTexts = trainSet.map(d => d.text);
  const yTrain = trainSet.map(d => d.label);

  const XTestTexts = testSet.map(d => d.text);
  const yTest = testSet.map(d => d.label);

  // TF-IDF Vectorizer
  const vectorizer = new TfidfVectorizer({
    maxFeatures: 8000,
    ngramRange: [1, 2],
    sublinearTf: true,
  });

  const XTrainVec = vectorizer.fitTransform(XTrainTexts);
  const XTestVec = vectorizer.transform(XTestTexts);

  // Logistic Regression Classifier
  const model = new LogisticRegression({
    C: 1.0,
    maxIter: 300,
    learningRate: 0.2,
    classWeight: 'balanced',
  });

  model.fit(XTrainVec, yTrain, vectorizer.featureNames.length);

  // Evaluation
  const yPred = model.predict(XTestVec);
  const labels = ['positive', 'negative', 'neutral'];
  const { report, accuracy } = generateClassificationReport(yTest, yPred, labels);

  // Count labels
  const labelCounts = {};
  for (const item of cleanData) {
    labelCounts[item.label] = (labelCounts[item.label] || 0) + 1;
  }

  // Save model artifacts to JSON
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
  }

  const serialized = {
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    vectorizer: vectorizer.toJSON(),
    classifier: model.toJSON(),
  };

  fs.writeFileSync(MODEL_PATH, JSON.stringify(serialized, null, 2), 'utf8');

  return {
    accuracy,
    report,
    train_size: trainSize,
    test_size: testSize,
    total_samples: totalSamples,
    label_counts: labelCounts,
    warnings,
    model_path: MODEL_PATH,
  };
}
