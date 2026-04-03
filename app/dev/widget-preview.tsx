/**
 * ウィジェット設計環境
 *
 * iOSウィジェットの実寸サイズでレイアウトを確認・調整できる画面。
 * NEWS/SOCIAL/MARKETタブ切り替え、Premium/Free両パターン対応。
 *
 * http://localhost:8081/dev/widget-preview
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useThemeContext } from '@/lib/theme-provider';
import { useCategoryData } from '@/hooks/use-real-time-data';
import { Topic, Category } from '@/lib/types';
import { getMarketIcon } from '@/lib/market-icons';

const WIDGET_SIZES = {
  small: { width: 169, height: 169 },
  medium: { width: 360, height: 169 },
  large: { width: 360, height: 376 },
} as const;

const SENTIMENT_COLORS: Record<string, string> = {
  blue: '#6366F1', green: '#10B981', yellow: '#F59E0B', red: '#EF4444',
};
const WAVE_LABELS: Record<string, string> = {
  low: '小波', medium: '通常波', high: '高波',
};
const TAB_LABELS: Record<Category, string> = {
  NEWS: 'NEWS', SOCIAL: 'SNS', MARKET: 'MARKET',
};
const TABS: Category[] = ['NEWS', 'SOCIAL', 'MARKET'];


// === Widget Tab Bar ===
function WidgetTabs({
  active, onSelect, size,
}: { active: Category; onSelect: (c: Category) => void; size: 'small' | 'medium' | 'large' }) {
  const isSmall = size === 'small';
  return (
    <View style={[styles.tabRow, isSmall && { marginBottom: 4 }]}>
      {TABS.map((tab) => (
        <Pressable
          key={tab}
          onPress={() => onSelect(tab)}
          style={({ pressed }) => [
            styles.tabBtn,
            isSmall && styles.tabBtnSmall,
            active === tab && styles.tabBtnActive,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={[
            styles.tabBtnText,
            { fontSize: isSmall ? 9 : 10 },
            active === tab ? styles.tabBtnTextActive : styles.tabBtnTextInactive,
          ]}>
            {TAB_LABELS[tab]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// === NEWS Item Row ===
function NewsRow({ item, compact }: { item: Topic; compact?: boolean }) {
  const sc = SENTIMENT_COLORS[item.waveSentiment] || '#6366F1';
  return (
    <View style={styles.listRow}>
      <View style={[styles.waveBar, { backgroundColor: sc, height: compact ? 24 : 28 }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.listTitle, compact && { fontSize: 11 }]} numberOfLines={compact ? 1 : 2}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{item.source}</Text>
          <Text style={[styles.metaText, { color: sc, marginLeft: 6 }]}>{WAVE_LABELS[item.waveLevel]}</Text>
        </View>
      </View>
    </View>
  );
}

// === MARKET Grid Cell (Small widget用 2x2) ===
function MarketCell({ item }: { item: Topic }) {
  const pct = item.marketChangePercent || 0;
  const isPos = pct >= 0;
  const color = isPos ? '#10B981' : '#EF4444';
  const sym = item.marketSymbol || '?';
  const icon = getMarketIcon(sym);
  const currency = item.marketCurrency || 'USD';
  const price = item.marketPrice || 0;
  const priceStr = currency === 'JPY' ? '¥' + Math.round(price).toLocaleString() : '$' + price.toFixed(price < 10 ? 2 : 0);

  return (
    <View style={styles.marketCell}>
      <View style={[styles.cellIcon, { backgroundColor: icon.bg }]}>
        <Text style={{ fontSize: 10, color: '#FFF', fontWeight: 'bold' }}>{icon.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cellSym} numberOfLines={1}>{sym}</Text>
        <Text style={[styles.cellChange, { color }]}>{isPos ? '+' : ''}{pct.toFixed(1)}%</Text>
      </View>
    </View>
  );
}

// === MARKET Item Row (with icon) ===
function MarketRow({ item, compact }: { item: Topic; compact?: boolean }) {
  const price = item.marketPrice || 0;
  const pct = item.marketChangePercent || 0;
  const currency = item.marketCurrency || 'USD';
  const isPos = pct >= 0;
  const color = isPos ? '#10B981' : '#EF4444';
  const sym = item.marketSymbol || item.title?.split(' - ')[0] || '?';
  const priceStr = currency === 'JPY' ? '¥' + Math.round(price).toLocaleString() : '$' + price.toFixed(2);
  const icon = getMarketIcon(sym);
  const iconSize = compact ? 18 : 22;
  const fs = compact ? 10 : 12;

  return (
    <View style={[styles.marketRow, compact && { paddingVertical: 2 }]}>
      {/* Icon */}
      <View style={[styles.iconCircle, { width: iconSize, height: iconSize, borderRadius: iconSize / 2, backgroundColor: icon.bg }]}>
        <Text style={[styles.iconText, { fontSize: compact ? 9 : 11 }]}>{icon.emoji}</Text>
      </View>
      {/* Symbol */}
      <Text style={[styles.marketSym, { fontSize: fs }]} numberOfLines={1}>{sym}</Text>
      {/* Price + Change */}
      <Text style={[styles.marketPrice, { fontSize: fs }]}>{priceStr}</Text>
      <View style={[styles.marketBadge, { backgroundColor: isPos ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
        <Text style={[styles.marketChange, { color, fontSize: compact ? 9 : 10 }]}>{isPos ? '+' : ''}{pct.toFixed(1)}%</Text>
      </View>
    </View>
  );
}

// === Small Widget ===
function WidgetSmall({ items, tab, onTab, warning }: WidgetProps) {
  return (
    <View style={[styles.widgetBg, WIDGET_SIZES.small]}>
      <View style={styles.header}>
        <Text style={styles.logo}>SWELL</Text>
      </View>
      <WidgetTabs active={tab} onSelect={onTab} size="small" />

      {warning ? (
        <View style={styles.warningCenter}>
          <Text style={styles.warningIcon}>⚠</Text>
          <Text style={styles.warningText}>{warning}</Text>
          <Text style={styles.warningCta}>Premium →</Text>
        </View>
      ) : tab === 'MARKET' ? (
        <View style={styles.marketGrid}>
          {items.slice(0, 4).map((it) => <MarketCell key={it.id} item={it} />)}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {items[0] && (
            <Text style={styles.smallTitle} numberOfLines={4}>{items[0].title}</Text>
          )}
        </View>
      )}
    </View>
  );
}

// === Medium Widget ===
function WidgetMedium({ items, tab, onTab, warning }: WidgetProps) {
  return (
    <View style={[styles.widgetBg, WIDGET_SIZES.medium]}>
      <View style={styles.header}>
        <Text style={styles.logo}>SWELL</Text>
        <View style={{ flex: 1 }} />
        <WidgetTabs active={tab} onSelect={onTab} size="medium" />
      </View>
      <View style={styles.divider} />

      {warning ? (
        <View style={styles.warningRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.warningText}>{warning}</Text>
          </View>
          <View style={styles.warningCtaBox}>
            <Text style={styles.warningCta}>Premium →</Text>
          </View>
        </View>
      ) : tab === 'MARKET' ? (
        <View style={{ flex: 1 }}>
          {items.slice(0, 5).map((it) => <MarketRow key={it.id} item={it} compact />)}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {items.slice(0, 3).map((it) => <NewsRow key={it.id} item={it} compact />)}
        </View>
      )}
    </View>
  );
}

// === Large Widget ===
function WidgetLarge({ items, tab, onTab, warning }: WidgetProps) {
  const count = warning ? 3 : (tab === 'MARKET' ? 10 : 5);
  return (
    <View style={[styles.widgetBg, WIDGET_SIZES.large]}>
      <View style={styles.header}>
        <Text style={[styles.logo, { fontSize: 14 }]}>SWELL</Text>
        <View style={{ flex: 1 }} />
        <WidgetTabs active={tab} onSelect={onTab} size="large" />
      </View>
      <View style={styles.divider} />

      {tab === 'MARKET' ? (
        <View style={{ flex: 1 }}>
          {items.slice(0, count).map((it) => <MarketRow key={it.id} item={it} compact />)}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {items.slice(0, count).map((it, i) => (
            <View key={it.id}>
              <NewsRow item={it} />
              {i < count - 1 && <View style={[styles.divider, { opacity: 0.3 }]} />}
            </View>
          ))}
        </View>
      )}

      {warning && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningBannerText}>⚠ {warning}</Text>
          <Text style={styles.warningBannerCta}>Premium →</Text>
        </View>
      )}
    </View>
  );
}

interface WidgetProps {
  items: Topic[];
  tab: Category;
  onTab: (c: Category) => void;
  warning?: string;
}

// === Main Preview ===
export default function WidgetPreviewScreen() {
  const { themeConfig } = useThemeContext();
  const tc = themeConfig.colors;
  const [tab, setTab] = useState<Category>('NEWS');
  const [showWarning, setShowWarning] = useState(false);

  const { topics } = useCategoryData(tab);
  const warningMsg = showWarning ? 'トライアル終了 — Premiumで全機能を解放' : undefined;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: tc.background }]}>
      <View style={styles.container}>
        <Text style={[styles.pageTitle, { color: tc.foreground }]}>Widget Design Lab</Text>
        <Text style={[styles.pageSubtitle, { color: tc.muted }]}>タブ切り替え対応 · 実寸プレビュー</Text>

        {/* Mode toggle */}
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => setShowWarning(false)}
            style={({ pressed }) => [styles.toggleBtn, { backgroundColor: !showWarning ? '#10B981' : tc.surface, borderColor: tc.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.toggleText, { color: !showWarning ? '#FFF' : tc.muted }]}>Premium</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowWarning(true)}
            style={({ pressed }) => [styles.toggleBtn, { backgroundColor: showWarning ? '#EF4444' : tc.surface, borderColor: tc.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.toggleText, { color: showWarning ? '#FFF' : tc.muted }]}>Free(警告)</Text>
          </Pressable>
        </View>

        {/* Small */}
        <Text style={[styles.sizeLabel, { color: tc.muted }]}>Small (169×169)</Text>
        <View style={styles.previewContainer}>
          <WidgetSmall items={topics} tab={tab} onTab={setTab} warning={warningMsg} />
        </View>

        {/* Medium */}
        <Text style={[styles.sizeLabel, { color: tc.muted }]}>Medium (360×169)</Text>
        <View style={styles.previewContainer}>
          <WidgetMedium items={topics} tab={tab} onTab={setTab} warning={warningMsg} />
        </View>

        {/* Large */}
        <Text style={[styles.sizeLabel, { color: tc.muted }]}>Large (360×376)</Text>
        <View style={styles.previewContainer}>
          <WidgetLarge items={topics} tab={tab} onTab={setTab} warning={warningMsg} />
        </View>

        <View style={{ height: 60 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 16, alignItems: 'center' },
  pageTitle: { fontSize: 20, fontWeight: 'bold', fontFamily: 'monospace', marginTop: 50, marginBottom: 4 },
  pageSubtitle: { fontSize: 12, fontFamily: 'monospace', marginBottom: 16 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  toggleText: { fontSize: 13, fontWeight: '600', fontFamily: 'monospace' },
  sizeLabel: { fontSize: 11, fontFamily: 'monospace', marginBottom: 8, alignSelf: 'flex-start', marginLeft: 16 },
  previewContainer: {
    marginBottom: 24, borderRadius: 22, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  // Widget base
  widgetBg: { backgroundColor: '#1A1A2E', padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  logo: { fontSize: 12, fontWeight: 'bold', fontFamily: 'monospace', color: '#E11D48' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 4 },
  // Tabs
  tabRow: { flexDirection: 'row', gap: 3 },
  tabBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  tabBtnSmall: { paddingHorizontal: 8, paddingVertical: 4 },
  tabBtnActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  tabBtnText: { fontFamily: 'monospace', fontWeight: '600' },
  tabBtnTextActive: { color: '#FFFFFF' },
  tabBtnTextInactive: { color: 'rgba(255,255,255,0.35)' },
  // News
  smallTitle: { fontSize: 13, fontWeight: '600', color: '#FFFFFF', flex: 1 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  waveBar: { width: 3, borderRadius: 2 },
  listTitle: { fontSize: 12, fontWeight: '500', color: '#FFFFFF' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  metaText: { fontSize: 8, fontFamily: 'monospace', color: 'rgba(255,255,255,0.45)' },
  // Market
  iconCircle: { justifyContent: 'center', alignItems: 'center' },
  iconText: { color: '#FFFFFF', fontWeight: 'bold' },
  // Market grid (Small)
  marketGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  marketCell: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3 },
  cellIcon: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  cellSym: { fontSize: 9, fontWeight: '600', fontFamily: 'monospace', color: '#FFFFFF' },
  cellChange: { fontSize: 9, fontWeight: '600', fontFamily: 'monospace' },
  // Market row (Medium/Large)
  marketRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, gap: 5 },
  marketSym: { flex: 1, fontSize: 11, fontWeight: '600', fontFamily: 'monospace', color: '#FFFFFF' },
  marketPrice: { fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)' },
  marketBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, minWidth: 48, alignItems: 'center' },
  marketChange: { fontSize: 10, fontWeight: '600', fontFamily: 'monospace' },
  // Warning
  warningCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 4 },
  warningIcon: { fontSize: 18 },
  warningText: { fontSize: 10, color: '#F59E0B', fontWeight: '500', textAlign: 'center' },
  warningCta: { fontSize: 10, color: '#6366F1', fontWeight: '700', fontFamily: 'monospace' },
  warningRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  warningCtaBox: { backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  warningBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, marginTop: 6,
  },
  warningBannerText: { fontSize: 9, color: '#F59E0B', fontWeight: '500' },
  warningBannerCta: { fontSize: 9, color: '#6366F1', fontWeight: '700', fontFamily: 'monospace' },
});
