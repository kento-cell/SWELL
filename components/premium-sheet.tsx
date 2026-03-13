import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePlan } from '@/lib/plan-context';

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

function CheckMark({ active }: { active: boolean }) {
  return (
    <Text style={[styles.checkMark, active ? styles.checkMarkActive : styles.checkMarkInactive]}>
      {active ? '✓' : '—'}
    </Text>
  );
}

export function PremiumSheet({ onClose }: PremiumSheetProps) {
  const { plan, setPlan } = usePlan();

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
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.premiumBadge}>PREMIUM</Text>
          <Text style={styles.title}>すべての波を観測する</Text>
          <Text style={styles.price}>月額 ¥480</Text>
        </View>

        {/* Feature comparison */}
        <ScrollView style={styles.featureList} showsVerticalScrollIndicator={false}>
          {/* Column headers */}
          <View style={styles.featureRow}>
            <View style={styles.featureLabelCol} />
            <View style={styles.featureCheckCol}>
              <Text style={styles.colHeader}>Free</Text>
            </View>
            <View style={styles.featureCheckCol}>
              <Text style={[styles.colHeader, styles.premiumColHeader]}>Premium</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <View style={styles.featureLabelCol}>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
              <View style={styles.featureCheckCol}>
                <CheckMark active={f.free} />
              </View>
              <View style={styles.featureCheckCol}>
                <CheckMark active={f.premium} />
              </View>
            </View>
          ))}
        </ScrollView>

        {/* CTA */}
        <View style={styles.ctaArea}>
          {plan === 'free' ? (
            <Pressable
              onPress={handleUpgrade}
              style={({ pressed }) => [styles.upgradeButton, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.upgradeButtonText}>Premiumにアップグレード（¥480/月）</Text>
            </Pressable>
          ) : (
            <View style={styles.alreadyPremium}>
              <Text style={styles.alreadyPremiumText}>✓ Premiumプラン利用中</Text>
              <Pressable onPress={handleDowngrade}>
                <Text style={styles.downgradeText}>Freeに戻す（デモ用）</Text>
              </Pressable>
            </View>
          )}
          <Text style={styles.disclaimer}>
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
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#374151',
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
    color: '#A78BFA',
    fontSize: 11,
    fontFamily: 'monospace',
    letterSpacing: 3,
    fontWeight: '700',
  },
  title: {
    color: '#E8EDF5',
    fontSize: 18,
    fontWeight: '700',
  },
  price: {
    color: '#A78BFA',
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
    color: '#6B7280',
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  premiumColHeader: {
    color: '#A78BFA',
  },
  divider: {
    height: 1,
    backgroundColor: '#1F2937',
    marginBottom: 4,
  },
  featureLabel: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  checkMark: {
    fontSize: 14,
    fontWeight: '700',
  },
  checkMarkActive: {
    color: '#10B981',
  },
  checkMarkInactive: {
    color: '#374151',
  },
  ctaArea: {
    padding: 20,
    gap: 10,
    alignItems: 'center',
  },
  upgradeButton: {
    backgroundColor: '#A78BFA',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 2,
    width: '100%',
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#0A0E1A',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  alreadyPremium: {
    alignItems: 'center',
    gap: 8,
  },
  alreadyPremiumText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
  downgradeText: {
    color: '#6B7280',
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  disclaimer: {
    color: '#374151',
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});
