/**
 * オンボーディング: 興味ジャンル選択画面
 *
 * 初回起動時にフルスクリーンモーダルで表示。
 * ユーザーが興味あるジャンルを選択し、フィードをパーソナライズ。
 */
import React, { useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useThemeContext } from '@/lib/theme-provider';
import { AVAILABLE_INTERESTS, InterestCategory } from '@/hooks/use-interests';

interface OnboardingProps {
  onComplete: (selectedIds: string[]) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { themeConfig } = useThemeContext();
  const tc = themeConfig.colors;
  const [selected, setSelected] = useState<string[]>([]);
  const [step, setStep] = useState<'welcome' | 'select'>('welcome');

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const newsInterests = AVAILABLE_INTERESTS.filter((i) => i.group === 'news');
  const socialInterests = AVAILABLE_INTERESTS.filter((i) => i.group === 'social');

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: tc.background }]}>
        {step === 'welcome' ? (
          /* Step 1: Welcome */
          <View style={styles.welcomeContainer}>
            <Text style={[styles.logo, { color: tc.primary }]}>SWELL</Text>
            <Text style={[styles.welcomeTitle, { color: tc.foreground }]}>
              波を読む
            </Text>
            <Text style={[styles.welcomeDesc, { color: tc.muted }]}>
              ニュース・トレンド・マーケットの{'\n'}
              「波」を、あなた好みにカスタマイズ
            </Text>

            <View style={[styles.trialBadge, { borderColor: '#10B981' }]}>
              <Text style={[styles.trialBadgeText, { color: '#10B981' }]}>
                7日間 Premium 無料トライアル
              </Text>
            </View>

            <Pressable
              onPress={() => setStep('select')}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: tc.primary, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.primaryBtnText}>はじめる</Text>
            </Pressable>
          </View>
        ) : (
          /* Step 2: Interest Selection */
          <ScrollView style={styles.selectContainer} contentContainerStyle={styles.selectContent}>
            <Text style={[styles.selectTitle, { color: tc.foreground }]}>
              気になるジャンルを選択
            </Text>
            <Text style={[styles.selectDesc, { color: tc.muted }]}>
              あなたに合った情報を優先表示します（あとから変更可能）
            </Text>

            {/* NEWS系 */}
            <Text style={[styles.groupLabel, { color: tc.muted }]}>ニュース</Text>
            <View style={styles.chipGrid}>
              {newsInterests.map((item) => (
                <Chip
                  key={item.id}
                  item={item}
                  isSelected={selected.includes(item.id)}
                  onPress={() => toggle(item.id)}
                  tc={tc}
                />
              ))}
            </View>

            {/* SOCIAL系 */}
            <Text style={[styles.groupLabel, { color: tc.muted }]}>SNS・バズ</Text>
            <View style={styles.chipGrid}>
              {socialInterests.map((item) => (
                <Chip
                  key={item.id}
                  item={item}
                  isSelected={selected.includes(item.id)}
                  onPress={() => toggle(item.id)}
                  tc={tc}
                />
              ))}
            </View>

            <Text style={[styles.counter, { color: tc.muted }]}>
              {selected.length}個選択中{selected.length < 3 ? '（3個以上がおすすめ）' : ' ✓'}
            </Text>

            <Pressable
              onPress={() => onComplete(selected)}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: selected.length > 0 ? tc.primary : tc.border,
                  opacity: pressed ? 0.8 : 1,
                  marginTop: 16,
                  marginBottom: 40,
                },
              ]}
            >
              <Text style={styles.primaryBtnText}>
                {selected.length > 0 ? 'この設定で始める' : 'スキップ'}
              </Text>
            </Pressable>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function Chip({
  item,
  isSelected,
  onPress,
  tc,
}: {
  item: InterestCategory;
  isSelected: boolean;
  onPress: () => void;
  tc: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: isSelected ? 'rgba(99,102,241,0.15)' : tc.surface,
          borderColor: isSelected ? '#6366F1' : tc.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={styles.chipEmoji}>{item.emoji}</Text>
      <Text style={[styles.chipLabel, { color: isSelected ? '#6366F1' : tc.foreground }]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Welcome
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 4,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '300',
    marginTop: 8,
    letterSpacing: 6,
  },
  welcomeDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 24,
  },
  trialBadge: {
    marginTop: 32,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  trialBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  primaryBtn: {
    marginTop: 40,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Select
  selectContainer: {
    flex: 1,
  },
  selectContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  selectTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  selectDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  counter: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 20,
  },
});
