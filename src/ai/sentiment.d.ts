export type SentimentLabel = 'negatif' | 'netral' | 'positif';

export type SentimentModel = {
  schema_version: 1;
  algorithm: 'LinearSVC';
  status: string;
  preprocessing:
    | 'ascii_lowercase_words_unigram_bigram_sublinear_tf_l2_v1'
    | 'unicode_nfkd_ascii_words_unigram_bigram_sublinear_tf_l2_v1';
  labels: SentimentLabel[];
  aliases: Record<string, string>;
  vocabulary: Record<string, number>;
  idf: number[];
  weights: number[][];
  bias: number[];
};

export type SentimentPrediction =
  | {
      status: 'predicted';
      label: SentimentLabel;
      scores: number[];
      scoreType: 'decision_margin';
      experimental: boolean;
    }
  | {
      status: 'empty_input' | 'unknown_vocabulary';
      label: null;
      scores: null;
      scoreType: 'none';
      experimental: true;
    };

export function createSentimentClassifier(
  model: SentimentModel,
): (text: string) => SentimentPrediction;
