/**
 * トライアル終了警告モーダル
 *
 * 残り3日/1日/当日/終了後 で段階的に表示。
 * ユーザーが失う機能を具体的に見せて課金を促進。
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext } from '@/lib/theme-provider';
import { usePlan } from '@/lib/plan-context';

const WARNING_SHOWN_KEY = 'swell_trial_warning_';

interface TrialWarningProps {
  onUpgrade: () => void;
}

export function TrialWarning({ onUpgrade }: TrialWarningProps) {
  const { themeConfig } = useThemeContext();
  const tc = themeConfig.colors;
  const { trialDaysLeft, isSubscribed, isTrial } = usePlan();
  const [visible, setVisible] = useState(false);
  const [warningType, setWarningType] = useState<'day3' | 'day1' | 'day0' | 'expired'>('day3');

  useEffect(() => {
    if (isSubscribed) return;
    checkAndShow();
  }, [trialDaysLeft, isSubscribed]);

  async function checkAndShow() {
    let type: typeof warningType | null = null;

    if (trialDaysLeft === 0 && !isTrial) {
      type = 'expired';
    } else if (trialDaysLeft === 1) {
      type = 'day1';
    } else if (trialDaysLeft === 0 && isTrial) {
      type = 'day0';
    }

    if (!type) return;

    // 同じ警告を1日に1回だけ表示
    const today = new Date().toISOString().slice(0, 10);
    const key = `${WARNING_SHOWN_KEY}${type}_${today}`;
    const shown = await AsyncStorage.getItem(key);
    if (shown) return;

    setWarningType(type);
    setVisible(true);
    await AsyncStorage.setItem(key, 'true');
  }

  const dismiss = () => setVisible(false);

  const config = {
    day3: {
      title: 'Premium トライアル残り3日',
      message: 'トライアル終了後、以下の機能が制限されます',
      features: [
        'MARKET: 暗号通貨・為替・投資信託・コモディティが非表示',
        'NEWS/SOCIAL: 表示が5件に制限',
        'ウォッチリスト: 2銘柄に制限',
        '自動更新が停止',
      ],
      cta: '今すぐPremiumにする',
      dismiss: 'あとで',
      accent: '#F59E0B',
    },
    day1: {
      title: '明日 トライアルが終了します',
      message: '今日中にPremiumに登録すると、中断なく利用できます',
      features: [
        '30銘柄のリアルタイム表示 → 3銘柄に',
        'ウォッチリストが2銘柄に制限',
        'ニュース・バズが5件に制限',
      ],
      cta: 'Premiumを続ける',
      dismiss: '明日また',
      accent: '#EF4444',
    },
    day0: {
      title: '本日 トライアル最終日',
      message: '今日を過ぎると機能が制限されます',
      features: [
        'あなたのウォッチリストが制限されます',
        '暗号通貨・為替データが見れなくなります',
        '自動更新が停止します',
      ],
      cta: '今すぐPremiumにする',
      dismiss: '閉じる',
      accent: '#EF4444',
    },
    expired: {
      title: 'トライアルが終了しました',
      message: 'Premiumで全機能を使い続けましょう',
      features: [
        '全30銘柄+のリアルタイムデータ',
        'ウォッチリスト無制限',
        'NEWS/SOCIAL 全件表示',
        '2〜5分自動更新',
      ],
      cta: 'Premiumにアップグレード',
      dismiss: 'Freeで使う',
      accent: '#6366F1',
    },
  };

  const c = config[warningType];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.border }]}>
          {/* Header */}
          <View style={[styles.accent, { backgroundColor: c.accent }]} />
          <Text style={[styles.title, { color: tc.foreground }]}>{c.title}</Text>
          <Text style={[styles.message, { color: tc.muted }]}>{c.message}</Text>

          {/* Feature list */}
          <View style={styles.featureList}>
            {c.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureBullet}>{warningType === 'expired' ? '✓' : '⚠'}</Text>
                <Text style={[styles.featureText, { color: tc.foreground }]}>{f}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <Pressable
            onPress={() => { dismiss(); onUpgrade(); }}
            style={({ pressed }) => [styles.ctaBtn, { backgroundColor: c.accent, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.ctaBtnText}>{c.cta}</Text>
          </Pressable>

          {/* Dismiss */}
          <Pressable
            onPress={dismiss}
            style={({ pressed }) => [styles.dismissBtn, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Text style={[styles.dismissText, { color: tc.muted }]}>{c.dismiss}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  featureList: {
    marginTop: 20,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  featureBullet: {
    fontSize: 14,
    marginTop: 1,
  },
  featureText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  ctaBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dismissBtn: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 13,
  },
});
