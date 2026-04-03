/**
 * トライアルバナー / アップグレード促進バナー
 *
 * - トライアル中: 残日数を表示
 * - Free降格後: アップグレード誘導
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeContext } from '@/lib/theme-provider';
import { usePlan } from '@/lib/plan-context';

interface TrialBannerProps {
  onUpgradePress: () => void;
}

export function TrialBanner({ onUpgradePress }: TrialBannerProps) {
  const { themeConfig } = useThemeContext();
  const tc = themeConfig.colors;
  const { isPremium, isTrial, trialDaysLeft, isSubscribed } = usePlan();

  // 課金済みなら非表示
  if (isSubscribed) return null;

  if (isTrial) {
    // トライアル中
    return (
      <View style={[styles.banner, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' }]}>
        <Text style={[styles.bannerText, { color: '#10B981' }]}>
          Premium トライアル中 — 残り{trialDaysLeft}日
        </Text>
      </View>
    );
  }

  // Free降格後
  return (
    <Pressable
      onPress={onUpgradePress}
      style={({ pressed }) => [
        styles.banner,
        { backgroundColor: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.3)', opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={[styles.bannerText, { color: '#6366F1' }]}>
        Premiumにアップグレード — 全機能を解放
      </Text>
    </Pressable>
  );
}

/**
 * コンテンツ末尾に表示する「もっと見る」誘導
 */
interface UpgradePromptProps {
  message: string;
  onPress: () => void;
}

export function UpgradePrompt({ message, onPress }: UpgradePromptProps) {
  const { themeConfig } = useThemeContext();
  const tc = themeConfig.colors;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.prompt, { backgroundColor: tc.surface, borderColor: tc.border, opacity: pressed ? 0.7 : 1 }]}
    >
      <Text style={[styles.promptIcon]}>🔒</Text>
      <Text style={[styles.promptText, { color: tc.foreground }]}>{message}</Text>
      <Text style={[styles.promptCta, { color: '#6366F1' }]}>Premium →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginVertical: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  promptIcon: {
    fontSize: 16,
  },
  promptText: {
    fontSize: 13,
    fontWeight: '500',
  },
  promptCta: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});
