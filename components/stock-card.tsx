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
  currency?: string;
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
  currency = 'USD',
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
    if (v == null || v <= 0) return null;
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

        {/* Header: Symbol and change badge */}
        <View style={styles.header}>
          <Text style={[styles.symbol, { color: tc.foreground }]}>{symbol}</Text>
          <View style={[styles.changeBadge, { backgroundColor: bgColor }]}>
            <Text style={[styles.changeText, { color: priceColor }]}>
              {isPositive ? '▲' : '▼'} {formatPercent(changePercent)}
            </Text>
          </View>
        </View>

        {/* Price section */}
        <View style={styles.priceSection}>
          <Text style={[styles.price, { color: priceColor }]}>{currency === 'JPY' ? '¥' : '$'}{currency === 'JPY' ? Math.round(price).toLocaleString() : formatPrice(price)}</Text>
          <Text style={[styles.changeAmount, { color: priceColor }]}>
            {formatChange(change)}
          </Text>
        </View>

        {/* Stats row */}
        {(dayHigh !== undefined || dayLow !== undefined || volume !== undefined) && (
          <View style={[styles.statsGrid, { borderTopColor: tc.border }]}>
            {dayHigh !== undefined && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: tc.muted }]}>高値</Text>
                <Text style={[styles.statValue, { color: tc.foreground }]}>{currency === 'JPY' ? '¥' + Math.round(dayHigh).toLocaleString() : '$' + formatPrice(dayHigh)}</Text>
              </View>
            )}
            {dayLow !== undefined && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: tc.muted }]}>安値</Text>
                <Text style={[styles.statValue, { color: tc.foreground }]}>{currency === 'JPY' ? '¥' + Math.round(dayLow).toLocaleString() : '$' + formatPrice(dayLow)}</Text>
              </View>
            )}
            {formatVolume(volume) && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: tc.muted }]}>出来高</Text>
                <Text style={[styles.statValue, { color: tc.foreground }]}>{formatVolume(volume)}</Text>
              </View>
            )}
          </View>
        )}
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
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  waveBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  symbol: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceSection: {
    marginBottom: 10,
    zIndex: 1,
  },
  price: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  changeAmount: {
    fontSize: 13,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    zIndex: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});
