import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { trainModel } from '../src/nlp/train.js';
import { predictText, predictDataset, resetModels, modelsExist } from '../src/nlp/predictor.js';

describe('Model Training & Sentiment Predictor', () => {
  before(() => {
    // Train a model from the sample training dataset
    trainModel('data/training.csv');
    resetModels();
  });

  test('modelsExist returns true after training', () => {
    assert.equal(modelsExist(), true);
  });

  test('predictText classifies positive statement correctly', () => {
    const res = predictText('I absolutely love this amazing product! Best purchase ever 😍');
    assert.equal(res.sentiment, 'positive');
    assert.ok(res.confidence > 0.33);
  });

  test('predictText classifies negative complaint correctly', () => {
    const res = predictText('Horrible customer service. Terrible delivery and broken item 😡');
    assert.equal(res.sentiment, 'negative');
    assert.ok(res.confidence > 0.33);
  });

  test('predictDataset classifies a batch of posts', () => {
    const batch = [
      { id: '1', text: 'Amazing service! Really impressed. 😍' },
      { id: '2', text: 'The delivery was extremely slow. 😡' },
      { id: '3', text: 'Received my order today.' },
    ];
    const results = predictDataset(batch);
    assert.equal(results.length, 3);
    assert.ok('sentiment' in results[0]);
    assert.ok('confidence' in results[0]);
    assert.equal(results[0].sentiment, 'positive');
    assert.equal(results[1].sentiment, 'negative');
  });

  test('predictText throws on empty input', () => {
    assert.throws(
      () => predictText('   '),
      /Input text cannot be empty/
    );
  });
});
