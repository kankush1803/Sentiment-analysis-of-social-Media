import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { preprocessText } from '../src/nlp/preprocess.js';

describe('Text Preprocessor', () => {
  test('expands emojis to sentiment tokens', () => {
    const text = 'I love this product 😍! Terrible app 😡';
    const cleaned = preprocessText(text);
    assert.ok(cleaned.includes('love'));
    assert.ok(cleaned.includes('angry'));
  });

  test('expands CamelCase hashtags into space-separated lowercase words', () => {
    const text = '#GreatService and #BadExperience';
    const cleaned = preprocessText(text);
    assert.ok(cleaned.includes('great service'));
    assert.ok(cleaned.includes('bad experience'));
  });

  test('removes @mentions and URLs', () => {
    const text = 'Hey @support check out https://example.com/test for issues';
    const cleaned = preprocessText(text);
    assert.ok(!cleaned.includes('@support'));
    assert.ok(!cleaned.includes('https'));
    assert.ok(!cleaned.includes('example.com'));
  });

  test('collapses elongated characters and excessive punctuation', () => {
    const text = 'This is sooooo cooool!!!!! Really????';
    const cleaned = preprocessText(text);
    assert.ok(cleaned.includes('soo cool'));
    assert.ok(cleaned.includes('!'));
    assert.ok(cleaned.includes('?'));
    assert.ok(!cleaned.includes('ooooo'));
  });
});
