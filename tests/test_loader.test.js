import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadCsv, parseCsvString } from '../src/data/loader.js';
import { validatePostsDataset, validateTrainingDataset } from '../src/data/validator.js';

describe('Data Loader & Parser', () => {
  test('parseCsvString parses standard and quoted CSV correctly', () => {
    const csv = 'id,text,date,platform\n1,"Hello, world!",2026-01-01,Twitter\n2,"Great service",2026-01-02,Instagram';
    const rows = parseCsvString(csv);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].id, '1');
    assert.equal(rows[0].text, 'Hello, world!');
    assert.equal(rows[0].platform, 'Twitter');
    assert.equal(rows[1].id, '2');
    assert.equal(rows[1].text, 'Great service');
  });

  test('loadCsv throws on missing file', () => {
    assert.throws(
      () => loadCsv('data/non_existent_file.csv'),
      /File not found/
    );
  });

  test('loadCsv throws on non-CSV extension', () => {
    assert.throws(
      () => loadCsv('README.md'),
      /Expected a \.csv file/
    );
  });

  test('loadCsv loads valid CSV file', () => {
    const rows = loadCsv('data/sample_posts.csv');
    assert.ok(rows.length > 0);
    assert.ok('text' in rows[0]);
  });
});

describe('Data Validator', () => {
  test('validatePostsDataset checks required columns and cleans empty text', () => {
    const raw = [
      { id: '1', text: 'Good service', platform: 'Twitter' },
      { id: '2', text: '   ', platform: 'Twitter' },
      { id: '3', text: 'Another post', platform: 'Instagram' },
    ];
    const { data, warnings } = validatePostsDataset(raw);
    assert.equal(data.length, 2);
    assert.equal(warnings.length, 2); // 1 dropped text warning, 1 missing date warning
  });

  test('validatePostsDataset throws when text column missing', () => {
    const raw = [{ id: '1', message: 'Hello' }];
    assert.throws(
      () => validatePostsDataset(raw),
      /required 'text' column/
    );
  });

  test('validateTrainingDataset normalizes labels and drops invalid', () => {
    const raw = [
      { text: 'love it', label: 'POSITIVE' },
      { text: 'bad', label: 'Negative ' },
      { text: 'neutral post', label: 'neutral' },
      { text: 'random', label: 'spam' },
    ];
    // Need at least 10 for valid check
    for (let i = 0; i < 8; i++) {
      raw.push({ text: `test post ${i}`, label: 'positive' });
    }

    const { data, warnings } = validateTrainingDataset(raw);
    assert.ok(data.length >= 10);
    assert.ok(data.every(d => ['positive', 'negative', 'neutral'].includes(d.label)));
    assert.ok(warnings.some(w => w.includes('unrecognised labels')));
  });
});
