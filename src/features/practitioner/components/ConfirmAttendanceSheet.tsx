import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  useNativeGesture,
  usePanGesture,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../../../components/Text';
import { colors, fontWeights, lineHeights, radius, spacing, typography } from '../theme';
import type { PraktikanIdentity, SessionDetail } from '../types';
import { Button } from './Button';
import { FeedbackBanner } from './FeedbackBanner';
import { InfoRow } from './InfoRow';

type ConfirmAttendanceSheetProps = {
  visible: boolean;
  praktikan: PraktikanIdentity;
  session: SessionDetail;
  isSubmitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Bottom sheet konfirmasi presensi (SRS-13).
 * Kehadiran hanya dicatat setelah pengguna menekan tombol konfirmasi.
 */
export function ConfirmAttendanceSheet({
  visible,
  praktikan,
  session,
  isSubmitting,
  errorMessage,
  onCancel,
  onConfirm,
}: ConfirmAttendanceSheetProps) {
  const insets = useSafeAreaInsets();
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(120));
  const scrollOffset = useRef(0);

  useEffect(() => {
    if (!visible) {
      return;
    }

    scrollOffset.current = 0;
    backdropOpacity.setValue(0);
    translateY.setValue(120);

    const animation = Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [backdropOpacity, translateY, visible]);

  const handleCancel = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 120,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onCancel();
      }
    });
  }, [backdropOpacity, isSubmitting, onCancel, translateY]);

  const springBack = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 20,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, translateY]);

  const nativeScrollGesture = useNativeGesture();

  const panGesture = usePanGesture({
    enabled: !isSubmitting,
    runOnJS: true,
    minDistance: 8,
    simultaneousWith: nativeScrollGesture,
    onBegin: () => {
      translateY.stopAnimation();
    },
    onUpdate: (event) => {
      if (scrollOffset.current > 0 || event.translationY <= 0) {
        return;
      }

      const next = Math.min(120, event.translationY);
      translateY.setValue(next);
      backdropOpacity.setValue(Math.max(0.35, 1 - next / 360));
    },
    onDeactivate: (event) => {
      if (event.canceled) {
        return;
      }

      if (scrollOffset.current <= 0 && (event.translationY > 100 || event.velocityY > 800)) {
        handleCancel();
        return;
      }

      springBack();
    },
    onFinalize: (event) => {
      if (event.canceled) {
        springBack();
      }
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      {visible ? <StatusBar style="light" /> : null}
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
          <Pressable
            style={styles.backdrop}
            onPress={handleCancel}
            accessible={false}
            importantForAccessibility="no"
          />

          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[styles.sheet, { transform: [{ translateY }] }]}
              accessibilityViewIsModal
            >
              <View style={styles.dragArea}>
                <View style={styles.handle} />
                <View>
                  <Text style={styles.title}>Konfirmasi Presensi</Text>
                  <Text style={styles.subtitle}>
                    Periksa identitas dan sesi sebelum mencatat kehadiran.
                  </Text>
                </View>
              </View>

              <GestureDetector gesture={nativeScrollGesture}>
                <ScrollView
                  style={styles.scroll}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  overScrollMode="never"
                  onScroll={(event) => {
                    scrollOffset.current = event.nativeEvent.contentOffset.y;
                  }}
                  scrollEventThrottle={16}
                  contentContainerStyle={[
                    styles.content,
                    { paddingBottom: Math.max(insets.bottom, spacing.xxxl) },
                  ]}
                >
                  <View>
                    <Text style={styles.sectionTitle}>Identitas</Text>
                    <InfoRow label="Nama" value={praktikan.name} />
                    <InfoRow label="NIM" value={praktikan.nim} last />
                  </View>

                  <View>
                    <Text style={styles.sectionTitle}>Sesi</Text>
                    <InfoRow label="Praktikum" value={session.practicalName} />
                    <InfoRow label="Pertemuan" value={session.meetingLabel} />
                    <InfoRow label="Kelas" value={session.className} />
                    <InfoRow label="Lab" value={session.lab} />
                    <InfoRow label="Tanggal" value={session.dateLabel} />
                    <InfoRow label="Waktu" value={session.timeRangeLabel} last />
                  </View>

                  {errorMessage ? (
                    <FeedbackBanner tone="error" title="Presensi gagal" message={errorMessage} />
                  ) : null}

                  <View style={styles.actions}>
                    <View style={styles.actionItem}>
                      <Button
                        label="Batal"
                        variant="secondary"
                        onPress={handleCancel}
                        disabled={isSubmitting}
                      />
                    </View>
                    <View style={styles.actionItem}>
                      <Button
                        label={isSubmitting ? 'Mencatat...' : 'Ya, Catat Presensi'}
                        onPress={onConfirm}
                        loading={isSubmitting}
                      />
                    </View>
                  </View>
                </ScrollView>
              </GestureDetector>
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '92%',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  dragArea: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  scroll: {
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.lg,
  },
  title: {
    fontSize: typography.screenTitle,
    lineHeight: lineHeights.screenTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textMuted,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
    fontSize: typography.caption,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionItem: {
    flex: 1,
  },
});
