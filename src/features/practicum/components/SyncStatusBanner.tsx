import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { colors, fontWeights, lineHeights, radius, spacing, typography } from '../theme';

type SyncStatusBannerProps = {
  error?: string | null;
  fromCache?: boolean;
  onRetry?: () => void;
};

/**
 * Menampilkan status data saat subscription Firestore memakai cache atau gagal.
 * Data lama tetap terlihat; banner ini hanya memberi tahu bahwa data mungkin
 * belum terbaru dan menyediakan tombol untuk berlangganan ulang.
 */
export function SyncStatusBanner({
  error = null,
  fromCache = false,
  onRetry,
}: SyncStatusBannerProps) {
  if (!error && !fromCache) return null;
  const isError = !!error;

  return (
    <View
      accessibilityLiveRegion={isError ? 'assertive' : 'polite'}
      accessibilityRole={isError ? 'alert' : undefined}
      style={[styles.banner, isError ? styles.error : styles.cache]}
    >
      <View style={styles.copy}>
        <Text style={[styles.title, isError ? styles.errorText : styles.cacheText]}>
          {isError ? 'Koneksi bermasalah' : 'Data tersimpan'}
        </Text>
        <Text style={[styles.message, isError ? styles.errorText : styles.cacheText]}>
          {isError
            ? error
            : 'Menampilkan data tersimpan. Data akan diperbarui saat koneksi ke server pulih.'}
        </Text>
      </View>
      {isError && onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Coba lagi sinkronisasi"
          onPress={onRetry}
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
        >
          <Text style={styles.retryLabel}>Coba lagi</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  error: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  cache: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.border,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: typography.secondary,
    fontWeight: fontWeights.bold,
  },
  message: {
    fontSize: typography.caption,
    lineHeight: lineHeights.body,
  },
  errorText: {
    color: colors.danger,
  },
  cacheText: {
    color: colors.warning,
  },
  retry: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pressed: { opacity: 0.8 },
  retryLabel: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
  },
});
