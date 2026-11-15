import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { analyzeSentiment, MAX_COMMENT_LENGTH } from '../../ai/classifier';
import type { SentimentLabel, SentimentPrediction } from '../../ai/sentiment';
import { ActionButton } from '../../components/ActionButton';
import { Text } from '../../components/Text';
import { colors, typography } from '../../theme/tokens';
import { useAuth } from '../auth/AuthProvider';
import { PracticumHeader } from '../practicum/components/PracticumHeader';

const results: Record<SentimentLabel, { title: string; color: string }> = {
  positif: { title: 'Positif', color: colors.lime },
  netral: { title: 'Netral', color: colors.lavender },
  negatif: { title: 'Negatif', color: colors.peach },
};

export function SentimentScreen() {
  const { profile } = useAuth();
  if (!profile) return <Redirect href="/" />;
  return <SentimentForm key={profile.uid} />;
}

function SentimentForm() {
  const router = useRouter();
  const [comment, setComment] = useState('');
  const [prediction, setPrediction] = useState<SentimentPrediction | null>(null);
  const [error, setError] = useState('');
  const result = prediction?.label ? results[prediction.label] : null;

  function changeComment(value: string) {
    setComment(value);
    setPrediction(null);
    setError('');
  }

  function analyze() {
    setError('');
    setPrediction(null);
    try {
      const next = analyzeSentiment(comment);
      setPrediction(next);
      if (next.status === 'empty_input')
        setError('Tulis komentar yang berisi huruf atau angka terlebih dahulu.');
      else if (next.status === 'unknown_vocabulary')
        setError(
          'Model belum mengenali kata dalam komentar ini. Coba gunakan kalimat yang lebih jelas.',
        );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Analisis belum berhasil. Silakan coba lagi.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PracticumHeader
        title="Analisis Sentimen"
        eyebrow="LAB EKSPERIMEN · LOKAL"
        subtitle="Coba baca nuansa komentar praktikum: positif, netral, atau negatif."
        onBack={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/profil');
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, styles.intro]}>
          <Text style={styles.eyebrow}>KOMENTARMU TETAP DI PERANGKAT</Text>
          <Text style={styles.heading}>Tulis. Analisis. Pelajari.</Text>
          <Text style={styles.copy}>
            Analisis berjalan lokal tanpa API atau internet setelah halaman dimuat. Komentar dan
            hasil tidak dikirim maupun disimpan ke Firebase.
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.heading}>Bagaimana praktikumnya?</Text>
          <Text style={styles.copy}>Tulis satu komentar tentang pengalaman praktikummu.</Text>
          <TextInput
            testID="sentiment-comment"
            accessibilityLabel="Komentar untuk analisis sentimen"
            placeholder="Contoh: Penjelasan asisten mudah dipahami."
            placeholderTextColor={colors.muted}
            selectionColor={colors.blue}
            multiline
            textAlignVertical="top"
            maxLength={MAX_COMMENT_LENGTH}
            style={styles.input}
            value={comment}
            onChangeText={changeComment}
          />
          <Text style={styles.meta}>{comment.length}/{MAX_COMMENT_LENGTH} karakter</Text>
          {!!error && (
            <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
              {error}
            </Text>
          )}
          <ActionButton title="Analisis komentar" onPress={analyze} testID="sentiment-analyze" />
          <ActionButton
            title="Bersihkan komentar"
            secondary
            disabled={!comment && !prediction && !error}
            onPress={() => changeComment('')}
            testID="sentiment-clear"
          />
        </View>
        {result && (
          <View
            testID="sentiment-result"
            accessibilityLiveRegion="polite"
            style={[styles.card, { backgroundColor: result.color }]}
          >
            <Text style={styles.eyebrow}>HASIL ANALISIS · EKSPERIMENTAL</Text>
            <Text accessibilityRole="header" style={styles.result}>
              {result.title}
            </Text>
            <Text style={styles.copy}>
              Ini prediksi model terhadap komentar di atas, bukan penilaian yang pasti.
            </Text>
          </View>
        )}
        <View style={[styles.card, styles.notice]}>
          <Text style={styles.eyebrow}>KENALI BATAS MODELNYA</Text>
          <Text style={styles.copy}>
            Model dilatih dari komentar evaluasi dosen/perkuliahan dan belum tervalidasi untuk
            praktikum. Kalimat dengan negasi dapat terbaca keliru; “Praktikumnya tidak bagus.”
            bahkan dapat diprediksi positif.
          </Text>
          <Text style={styles.copy}>
            Skor model bukan persentase keyakinan. Fitur ini hanya menganalisis sentimen komentar
            dan tidak digunakan untuk menentukan kategori atau keputusan izin.
          </Text>
          <Text style={styles.meta}>Sumber model: contoh praktikum PPK · dataset EDOM (Sam FCH).</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    width: '100%', maxWidth: 720, alignSelf: 'center',
    padding: 20, paddingBottom: 36, gap: 16,
  },
  card: {
    padding: 22, gap: 14, borderRadius: 28, borderWidth: 1,
    borderColor: colors.line, backgroundColor: colors.white,
  },
  intro: { backgroundColor: colors.lime },
  notice: { backgroundColor: colors.lavender },
  eyebrow: { color: colors.navy, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heading: { color: colors.navy, fontSize: 22, lineHeight: 29, fontWeight: '800' },
  copy: { color: colors.navy, fontSize: 14, lineHeight: 23 },
  meta: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  input: {
    minHeight: 150, padding: 16, borderRadius: 20, borderWidth: 1,
    borderColor: colors.line, backgroundColor: colors.background, color: colors.navy,
    fontSize: 15, lineHeight: 24, fontFamily: typography.family,
  },
  error: { color: colors.danger, fontSize: 13, lineHeight: 21 },
  result: { color: colors.navy, fontSize: 32, lineHeight: 40, fontWeight: '800' },
});
