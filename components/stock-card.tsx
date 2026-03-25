import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useThemeContext } from '@/lib/theme-provider';

export interface StockCardProps {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  onPress?: () => void;
}

export function StockCard({
  symbol,
  price,
  change,
  changePercent,
  dayHigh,
  dayLow,
  volume,
  onPress,
}: StockCardProps) {
  const { themeConfig } = useThemeContext();
  const tc = themeConfig.colors;

  // Determine color based on change
  const isPositive = changePercent >= 0;
  const priceColor = isPositive ? '#10B981' : '#EF4444';
  const bgColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

  // Wave animation
  const waveScale = useSharedValue(1);
  const waveOpacity = useSharedValue(0.3);

  useEffect(() => {
    waveScale.value = withRepeat(
      withTiming(1.2, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );

    waveOpacity.value = withRepeat(
      withTiming(0, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, []);

  const waveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale.value }],
    opacity: waveOpacity.value,
  }));

  // Format numbers
  const formatPrice = (p: number) => p.toFixed(2);
  const formatChange = (c: number) => (c >= 0 ? '+' : '') + c.toFixed(2);
  const formatPercent = (p: number) => (p >= 0 ? '+' : '') + p.toFixed(2) + '%';
  const formatVolume = (v?: number) => {
    if (!v) return 'N/A';
    if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return v.toString();
  };

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, { opacity: pressed ? 0.8 : 1 }]}>
      <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.border }]}>
        {/* Wave animation background */}
        <Animated.View
          style={[
            styles.waveBackground,
            waveAnimatedStyle,
            { backgroundColor: priceColor, opacity: 0.1 },
          ]}
        />

        {/* Header: Symbol and change */}
        <View style={styles.header}>
          <Text style={[styles.symbol, { color: tc.foreground }]}>{symbol}</Text>
          <View style={[styles.changeBadge, { backgroundColor: bgColor }]}>
            <Text style={[styles.changeText, { color: priceColor }]}>
              {isPositive ? '📈' : '📉'} {formatPercent(changePercent)}
            </Text>
          </View>
        </View>

        {/* Price section */}
        <View style={styles.priceSection}>
          <Text style={[styles.price, { color: priceColor }]}>${formatPrice(price)}</Text>
          <Text style={[styles.changeAmount, { color: priceColor }]}>
            {formatChange(change)}
          </Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {dayHigh !== undefined && (
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: tc.muted }]}>高値</Text>
              <Text style={[styles.statValue, { color: tc.foreground }]}>${formatPrice(dayHigh)}</Text>
            </View>
          )}
          {dayLow !== undefined && (
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: tc.muted }]}>安値</Text>
              <Text style={[styles.statValue, { color: tc.foreground }]}>${formatPrice(dayLow)}</Text>
            </View>
          )}
          {volume !== undefined && (
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: tc.muted }]}>出来高</Text>
              <Text style={[styles.statValue, { color: tc.foreground }]}>{formatVolume(volume)}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: tc.muted }]}>タップして詳細を表示</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  waveBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 1,
  },
  symbol: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  changeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  priceSection: {
    marginBottom: 20,
    zIndex: 1,
  },
  price: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  changeAmount: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    zIndex: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    zIndex: 1,
  },
});
