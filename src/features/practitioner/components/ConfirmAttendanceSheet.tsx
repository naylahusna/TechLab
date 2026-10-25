import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
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
  const dragStart = useRef(0);

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

  const panResponder = useMemo(() => {
    function springBack() {
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
    }

    // Refs are only read from gesture callbacks, not during render.
    // eslint-disable-next-line react-hooks/refs
    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_event, gesture) =>
        !isSubmitting &&
        scrollOffset.current <= 0 &&
        gesture.dy > 6 &&
        gesture.dy > Math.abs(gesture.dx),
      onPanResponderGrant: () => {
        translateY.stopAnimation((value) => {
          dragStart.current = value;
        });
      },
      onPanResponderMove: (_event, gesture) => {
        const next = Math.min(120, Math.max(0, dragStart.current + gesture.dy));
        translateY.setValue(next);
        backdropOpacity.setValue(Math.max(0.35, 1 - next / 360));
      },
      onPanResponderRelease: (_event, gesture) => {
        if (gesture.dy > 100 || gesture.vy > 0.8) {
          handleCancel();
          return;
        }

        springBack();
      },
      onPanResponderTerminate: () => {
        springBack();
      },
      onPanResponderTerminationRequest: () => false,
    });
  }, [backdropOpacity, handleCancel, isSubmitting, translateY]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      {visible ? <StatusBar style="light" /> : null}
      <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
        <Pressable
          style={styles.backdrop}
          onPress={handleCancel}
          accessible={false}
          importantForAccessibility="no"
        />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
          accessibilityViewIsModal
          {...panResponder.panHandlers}
        >
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
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
              <Text style={styles.title}>Konfirmasi Presensi</Text>
              <Text style={styles.subtitle}>
                Periksa identitas dan sesi sebelum mencatat kehadiran.
              </Text>
            </View>

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
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
