/**
 * MarketGroupCard - 複数銘柄を1カードにアイコン付きで表示
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useThemeContext } from '@/lib/theme-provider';
import { Topic } from '@/lib/types';
import { getMarketIcon } from '@/lib/market-icons';

interface MarketGroupCardProps {
  title: string;
  items: Topic[];
  onItemPress?: (item: Topic) => void;
}

export function MarketGroupCard({ title, items, onItemPress }: MarketGroupCardProps) {
  const { themeConfig } = useThemeContext();
  const tc = themeConfig.colors;

  return (
    <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.border }]}>
      <Text style={[styles.groupTitle, { color: tc.muted }]}>{title}</Text>

      {items.map((item) => {
        const price = item.marketPrice || 0;
        const changePercent = item.marketChangePercent || 0;
        const currency = item.marketCurrency || 'USD';
        const isPositive = changePercent >= 0;
        const priceColor = isPositive ? '#10B981' : '#EF4444';
        const symbol = item.marketSymbol || item.title?.split(' - ')[0] || '?';
        const icon = getMarketIcon(symbol);

        const priceStr = currency === 'JPY'
          ? '¥' + Math.round(price).toLocaleString()
          : '$' + price.toFixed(2);

        const changeStr = (isPositive ? '+' : '') + changePercent.toFixed(2) + '%';

        return (
          <Pressable
            key={item.id}
            onPress={() => onItemPress?.(item)}
            style={({ pressed }) => [
              styles.tickerRow,
              { borderBottomColor: tc.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            {/* Icon */}
            <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
              <Text style={styles.iconText}>{icon.emoji}</Text>
            </View>

            {/* Symbol */}
            <View style={styles.tickerLeft}>
              <Text style={[styles.tickerSymbol, { color: tc.foreground }]} numberOfLines={1}>
                {symbol}
              </Text>
            </View>

            {/* Price + Change */}
            <View style={styles.tickerRight}>
              <Text style={[styles.tickerPrice, { color: tc.foreground }]}>
                {priceStr}
              </Text>
              <View style={[styles.changeBadge, { backgroundColor: isPositive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
                <Text style={[styles.changeText, { color: priceColor }]}>
                  {changeStr}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  tickerLeft: {
    flex: 1,
  },
  tickerSymbol: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  tickerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tickerPrice: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  changeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});
