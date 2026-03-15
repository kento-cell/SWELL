import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePlan } from '@/lib/plan-context';
import { useThemeContext } from '@/lib/theme-provider';

interface PremiumSheetProps {
  onClose: () => void;
}

const FEATURES = [
  { label: 'NEWSカテゴリ', free: true, premium: true },
  { label: 'SOCIALカテゴリ', free: false, premium: true },
  { label: 'MARKETカテゴリ', free: false, premium: true },
  { label: '広告なし', free: false, premium: true },
  { label: '履歴（直近5件）', free: true, premium: false },
  { label: '履歴（無制限）', free: false, premium: true },
  { label: 'トピック保存', free: false, premium: true },
  { label: '通知', free: false, premium: true },
];

function CheckMark({ active, tc }: { active: boolean; tc: any }) {
  return (
    <Text style={[styles.checkMark, { color: active ? tc.success : tc.border }]}>
      {active ? '✓' : '—'}
    </Text>
  );
}

export function PremiumSheet({ onClose }: PremiumSheetProps) {
  const { plan, setPlan } = usePlan();
  const { themeConfig } = useThemeContext();
  const tc = themeConfig.colors;

  const handleUpgrade = () => {
    // Mock upgrade — in production this would trigger StoreKit
    setPlan('premium');
    onClose();
  };

  const handleDowngrade = () => {
    setPlan('free');
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: tc.surface, borderTopColor: tc.border }]}>
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: tc.border }]} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.premiumBadge, { color: tc.primary }]}>PREMIUM</Text>
          <Text style={[styles.title, { color: tc.foreground }]}>すべての波を観測する</Text>
          <Text style={[styles.price, { color: tc.primary }]}>月額 ¥480</Text>
        </View>

        {/* Feature comparison */}
        <ScrollView style={styles.featureList} showsVerticalScrollIndicator={false}>
          {/* Column headers */}
          <View style={styles.featureRow}>
            <View style={styles.featureLabelCol} />
            <View style={styles.featureCheckCol}>
              <Text style={[styles.colHeader, { color: tc.muted }]}>Free</Text>
            </View>
            <View style={styles.featureCheckCol}>
              <Text style={[styles.colHeader, { color: tc.primary }]}>Premium</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: tc.border }]} />

          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <View style={styles.featureLabelCol}>
                <Text style={[styles.featureLabel, { color: tc.muted }]}>{f.label}</Text>
              </View>
              <View style={styles.featureCheckCol}>
                <CheckMark active={f.free} tc={tc} />
              </View>
              <View style={styles.featureCheckCol}>
                <CheckMark active={f.premium} tc={tc} />
              </View>
            </View>
          ))}
        </ScrollView>

        {/* CTA */}
        <View style={styles.ctaArea}>
          {plan === 'free' ? (
            <Pressable
              onPress={handleUpgrade}
              style={({ pressed }) => [
                styles.upgradeButton,
                { backgroundColor: tc.primary, borderRadius: themeConfig.borderRadius.sm },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={[styles.upgradeButtonText, { color: tc.background }]}>
                Premiumにアップグレード（¥480/月）
              </Text>
            </Pressable>
          ) : (
            <View style={styles.alreadyPremium}>
              <Text style={[styles.alreadyPremiumText, { color: tc.success }]}>✓ Premiumプラン利用中</Text>
              <Pressable onPress={handleDowngrade}>
                <Text style={[styles.downgradeText, { color: tc.muted }]}>Freeに戻す（デモ用）</Text>
              </Pressable>
            </View>
          )}
          <Text style={[styles.disclaimer, { color: tc.muted }]}>
            ※ 現在はデモ版です。実際の課金は発生しません。
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 200,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    borderTopWidth: 1,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    gap: 6,
  },
  premiumBadge: {
    fontSize: 11,
    fontFamily: 'monospace',
    letterSpacing: 3,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  price: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  featureList: {
    paddingHorizontal: 20,
    maxHeight: 280,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureLabelCol: {
    flex: 1,
  },
  featureCheckCol: {
    width: 64,
    alignItems: 'center',
  },
  colHeader: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginBottom: 4,
  },
  featureLabel: {
    fontSize: 13,
  },
  checkMark: {
    fontSize: 14,
    fontWeight: '700',
  },
  ctaArea: {
    padding: 20,
    gap: 10,
    alignItems: 'center',
  },
  upgradeButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  alreadyPremium: {
    alignItems: 'center',
    gap: 8,
  },
  alreadyPremiumText: {
    fontSize: 14,
    fontWeight: '700',
  },
  downgradeText: {
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});
