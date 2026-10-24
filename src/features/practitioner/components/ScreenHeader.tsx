import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../../../components/Text';
import { colors, fontWeights, lineHeights, radius, spacing, typography } from '../theme';

export type ScreenSummaryItem = {
  value: string;
  label: string;
  tone?: 'light' | 'success' | 'danger';
};

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  greeting?: string;
  initials?: string;
  summary?: ScreenSummaryItem[];
};

export function ScreenHeader({ title, subtitle, greeting, initials, summary }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
      <StatusBar style="light" />

      <View
        pointerEvents="none"
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={styles.accentLayer}
      >
        <View style={styles.accentOrb} />
        <View style={styles.accentRing} />
        <View style={styles.accentLime} />
      </View>

      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>
            TechLab<Text style={styles.brandDot}>.</Text>
          </Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>Praktikan</Text>
          </View>
        </View>

        {initials ? (
          <View
            style={styles.avatar}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        ) : null}
      </View>

      {greeting ? <Text style={styles.greeting}>Halo, {greeting}</Text> : null}

      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {summary?.length ? (
        <View style={styles.summaryRow}>
          {summary.map((item) => {
            const success = item.tone === 'success';
            const danger = item.tone === 'danger';

            return (
              <View
                key={`${item.value}-${item.label}`}
                style={[
                  styles.summaryPill,
                  success ? styles.summarySuccess : null,
                  danger ? styles.summaryDanger : null,
                ]}
              >
                <Text
                  style={[
                    styles.summaryValue,
                    success ? styles.summarySuccessText : null,
                    danger ? styles.summaryDangerText : null,
                  ]}
                >
                  {item.value}
                </Text>
                <Text
                  style={[
                    styles.summaryLabel,
                    success ? styles.summarySuccessText : null,
                    danger ? styles.summaryDangerText : null,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
  },
  accentLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  accentOrb: {
    position: 'absolute',
    top: -70,
    right: -60,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: colors.heroOrb,
  },
  accentRing: {
    position: 'absolute',
    top: 22,
    right: -54,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: colors.heroRing,
  },
  accentLime: {
    position: 'absolute',
    bottom: -54,
    right: 74,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.heroLime,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brand: {
    color: colors.white,
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.bold,
  },
  brandDot: {
    color: colors.successSoft,
  },
  rolePill: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.xs,
  },
  roleText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.heroGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
  },
  greeting: {
    marginTop: spacing.lg,
    color: colors.onBlue,
    fontSize: typography.secondary,
    fontWeight: fontWeights.semibold,
  },
  title: {
    marginTop: spacing.xs,
    color: colors.white,
    fontSize: typography.screenTitle,
    lineHeight: lineHeights.screenTitle,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    marginTop: spacing.xs + 2,
    maxWidth: 340,
    color: colors.onBlue,
    fontSize: typography.body,
    lineHeight: lineHeights.body,
  },
  summaryRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 1,
    borderRadius: radius.pill,
    backgroundColor: colors.heroGlass,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 1,
  },
  summarySuccess: {
    backgroundColor: colors.successSoft,
  },
  summaryDanger: {
    backgroundColor: colors.dangerSoft,
  },
  summaryValue: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: fontWeights.bold,
  },
  summaryLabel: {
    color: colors.onBlue,
    fontSize: typography.caption,
    fontWeight: fontWeights.semibold,
  },
  summarySuccessText: {
    color: colors.text,
  },
  summaryDangerText: {
    color: colors.danger,
  },
});
