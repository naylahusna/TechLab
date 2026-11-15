import assert from 'node:assert/strict';
import test from 'node:test';
import model from '../src/ai/model-edom.json';
import { analyzeSentiment, assertSentimentModel, MAX_COMMENT_LENGTH } from '../src/ai/classifier';

test('imported model retains reference LinearSVC labels and decision margins', () => {
  assertSentimentModel(model);
  const examples = [
    ['Penjelasan asisten mudah dipahami', 'positif', [-0.7533587712862315, -0.8173556248267163, 0.4519002785515206]],
    ['Dosen tidak datang', 'negatif', [0.056379109537818106, -0.3831883828098493, -0.46774113821074037]],
    ['praktikum', 'netral', [-0.4525981434433595, 0.010593048659974402, -0.04562399603597403]],
  ] as const;
  for (const [text, label, margins] of examples) {
    const result = analyzeSentiment(text);
    assert.equal(result.status, 'predicted');
    if (result.status !== 'predicted') throw new Error('Reference prediction missing');
    assert.equal(result.label, label);
    assert.equal(result.scoreType, 'decision_margin');
    assert.equal(result.experimental, true);
    result.scores.forEach((value, index) => assert.ok(Math.abs(value - margins[index]) < 1e-12));
    assert.ok(!('confidence' in result));
  }
});

test('empty, punctuation-only and unknown vocabulary never become neutral predictions', () => {
  for (const text of ['', '   ', '😀 !!!']) {
    const result = analyzeSentiment(text);
    assert.equal(result.status, 'empty_input');
    assert.equal(result.label, null);
    assert.equal(result.scores, null);
  }
  const unknown = analyzeSentiment('qzxvblorp');
  assert.equal(unknown.status, 'unknown_vocabulary');
  assert.equal(unknown.label, null);
  assert.equal(unknown.scoreType, 'none');
  assert.throws(() => analyzeSentiment('x'.repeat(MAX_COMMENT_LENGTH + 1)), /maksimal/);
});

test('local classifier preserves preprocessing, needs no fetch, and exposes known negation limitation', () => {
  assert.deepEqual(
    analyzeSentiment('<p>Pénjelasan asisten MUDAH dipahami</p>'),
    analyzeSentiment('Penjelasan asisten mudah dipahami'),
  );
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('No network allowed'); };
  try {
    // Regression parity with the supplied model, NOT a claim that this label is correct.
    const negation = analyzeSentiment('Praktikumnya tidak bagus.');
    assert.equal(negation.label, 'positif');
    assert.equal(negation.experimental, true);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('invalid model formats, missing classes, malformed weights and unsafe IDF fail clearly', () => {
  for (const invalid of [
    null,
    { ...model, schema_version: 2 },
    { ...model, algorithm: 'other' },
    { ...model, preprocessing: 'unknown' },
    { ...model, labels: ['sakit', 'keluarga', 'lainnya'] },
    { ...model, labels: ['positif', 'positif', 'negatif'] },
    { ...model, idf: model.idf.map(() => 0) },
    { ...model, bias: [NaN, 0, 0] },
    { ...model, weights: [[0], [1], [2]] },
    { ...model, aliases: { word: null } },
    { ...model, vocabulary: { word: -1 } },
  ]) assert.throws(() => assertSentimentModel(invalid), /Model sentimen tidak dapat dibaca/);
});
