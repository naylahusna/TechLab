import modelData from './model-edom.json';
import {
  createSentimentClassifier,
  type SentimentModel,
  type SentimentPrediction,
} from './sentiment';

export const MAX_COMMENT_LENGTH = 2000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isVector(value: unknown, length: number): value is number[] {
  return Array.isArray(value) && value.length === length && value.every(Number.isFinite);
}

export function assertSentimentModel(value: unknown): asserts value is SentimentModel {
  const invalid = () => {
    throw new Error('Model sentimen tidak dapat dibaca. Coba buka ulang aplikasi.');
  };
  if (!isRecord(value)) return invalid();
  if (
    value.schema_version !== 1 ||
    value.algorithm !== 'LinearSVC' ||
    typeof value.status !== 'string' ||
    ![
      'ascii_lowercase_words_unigram_bigram_sublinear_tf_l2_v1',
      'unicode_nfkd_ascii_words_unigram_bigram_sublinear_tf_l2_v1',
    ].includes(String(value.preprocessing))
  )
    return invalid();
  const labels = value.labels;
  if (
    !Array.isArray(labels) || labels.length !== 3 ||
    !['negatif', 'netral', 'positif'].every((label) => labels.includes(label)) ||
    !isRecord(value.aliases) ||
    !Object.values(value.aliases).every((alias) => typeof alias === 'string') ||
    !isRecord(value.vocabulary)
  )
    return invalid();
  const indices = Object.values(value.vocabulary);
  const size = indices.length;
  if (
    !size ||
    new Set(indices).size !== size ||
    !indices.every((index) =>
      typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < size) ||
    !isVector(value.idf, size) || !value.idf.every((idf) => idf > 0) ||
    !isVector(value.bias, 3) || !Array.isArray(value.weights) ||
    value.weights.length !== 3 || !value.weights.every((row) => isVector(row, size))
  )
    return invalid();
}

let classifier: ((text: string) => SentimentPrediction) | undefined;

export function analyzeSentiment(comment: string): SentimentPrediction {
  if (comment.length > MAX_COMMENT_LENGTH)
    throw new Error(`Komentar maksimal ${MAX_COMMENT_LENGTH} karakter.`);
  // Initialize once, on demand. No network, Firebase, or permission-module access.
  if (!classifier) {
    assertSentimentModel(modelData);
    classifier = createSentimentClassifier(modelData);
  }
  return classifier(comment);
}
