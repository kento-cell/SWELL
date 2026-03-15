import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { usePlan } from '@/lib/plan-context';
import { useThemeContext } from '@/lib/theme-provider';

const STEPS = [
  {
    title: '波の色を読む',
    description:
      '波の色は話題への反応傾向を表します。\n\n青 = 中立　緑 = 好意的\n黄 = 賛否割れ　赤 = 炎上・過熱',
    colorHint: '#3B82F6',
  },
  {
    title: '波の高さを読む',
    description:
      '波の高さは話題性の大きさを表します。\n\n小波 = 静かな話題\n通常波 = 注目の話題\n高波 = 大きなうねり',
    colorHint: '#10B981',
  },
  {
    title: '左右に移動する',
    description:
      '左右の矢印ボタンをタップするか、\nカードを左右にスワイプして\n次のトピックへ移動できます。',
    colorHint: '#F59E0B',
  },
  {
    title: 'カテゴリを選ぶ',
    description:
      'NEWS / SOCIAL / MARKET の\n3つのカテゴリがあります。\n\nSOCIAL と MARKET は\nPremiumプランで利用できます。',
    colorHint: '#A78BFA',
  },
];

// Pixel wave illustration
function PixelWaveIllustration({ color }: { color: string }) {
  const p = 5;
  const rows = 8;
  const cols = 16;
  const pixels: { r: number; c: number; opacity: number }[] = [];

  for (let c = 0; c < cols; c++) {
    const waveRow = Math.floor(Math.sin((c / cols) * Math.PI * 3) * 2 + rows * 0.5);
    for (let r = waveRow; r < rows; r++) {
      pixels.push({ r, c, opacity: r === waveRow ? 1 : 0.3 });
    }
  }

  return (
    <Svg width={cols * p} height={rows * p}>
      {pixels.map((px, i) => (
        <Rect
          key={i}
          x={px.c * p}
          y={px.r * p}
          width={p - 1}
          height={p - 1}
          fill={color}
          opacity={px.opacity}
        />
      ))}
    </Svg>
  );
}

export function Tutorial() {
  const { setTutorialDone } = usePlan();
  const { themeConfig } = useThemeContext();
  const tc = themeConfig.colors;
  const [step, setStep] = useState(0);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const handleNext = () => {
    if (isLast) {
      setTutorialDone();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    setTutorialDone();
  };

  return (
    <View style={[styles.overlay, { backgroundColor: `${tc.background}F2` }]}>
      <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.border, borderRadius: themeConfig.borderRadius.sm }]}>
        {/* Step indicator */}
        <View style={styles.stepRow}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                i === step
                  ? [styles.stepDotActive, { backgroundColor: tc.primary }]
                  : [styles.stepDotInactive, { backgroundColor: tc.border }],
              ]}
            />
          ))}
        </View>

        {/* Illustration */}
        <View style={styles.illustration}>
          <PixelWaveIllustration color={current.colorHint} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: tc.foreground }]}>{current.title}</Text>

        {/* Description */}
        <Text style={[styles.description, { color: tc.muted }]}>{current.description}</Text>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [
              styles.skipButton,
              { borderColor: tc.border, borderRadius: themeConfig.borderRadius.sm },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={[styles.skipText, { color: tc.muted }]}>スキップ</Text>
          </Pressable>
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextButton,
              { backgroundColor: tc.primary, borderRadius: themeConfig.borderRadius.sm },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={[styles.nextText, { color: tc.background }]}>{isLast ? 'はじめる' : '次へ'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: 24,
  },
  card: {
    borderWidth: 1,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    gap: 16,
    alignItems: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 0,
  },
  stepDotActive: {
    width: 18,
  },
  stepDotInactive: {},
  illustration: {
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
    justifyContent: 'space-between',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    flex: 1,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 13,
    fontFamily: 'monospace',
  },
  nextButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 1,
    alignItems: 'center',
  },
  nextText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});
