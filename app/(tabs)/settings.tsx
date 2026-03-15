import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { PremiumSheet } from '@/components/premium-sheet';
import { PixelText } from '@/components/pixel-text';
import { PixelButton } from '@/components/pixel-button';
import { usePlan } from '@/lib/plan-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCurrentDataSource, setDataSource, getAvailableDataSources, type DataSource } from '@/lib/data-source-manager';
import { useThemeContext } from '@/lib/theme-provider';

const APP_VERSION = '1.0.0 (demo)';

function SettingRow({
  label,
  value,
  onPress,
  rightElement,
  accent,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.settingRow, pressed && onPress && { opacity: 0.7 }]}
    >
      <PixelText variant="body" color={accent ? 'accent' : 'primary'}>{label}</PixelText>
      {value && <PixelText variant="caption" color="muted">{value}</PixelText>}
      {rightElement}
      {onPress && !rightElement && <PixelText variant="body" color="muted">›</PixelText>}
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <PixelText variant="mono" color="muted">{title}</PixelText>
    </View>
  );
}

export default function SettingsScreen() {
  const { plan, setPlan } = usePlan();
  const { designTheme, setDesignTheme } = useThemeContext();
  const [showPremiumSheet, setShowPremiumSheet] = useState(false);
  const [dataSource, setDataSourceState] = useState<DataSource>('mock');

  useEffect(() => {
    getCurrentDataSource().then(setDataSourceState);
  }, []);

  const handleDataSourceChange = async (source: DataSource) => {
    setDataSourceState(source);
    await setDataSource(source);
  };

  const isPremium = plan === 'premium';

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>設定</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Plan Section */}
        <SectionHeader title="プラン" />
        <View style={styles.section}>
          <View style={styles.planCard}>
            <View style={styles.planCardLeft}>
              <Text style={[styles.planBadge, isPremium ? styles.planBadgePremium : styles.planBadgeFree]}>
                {isPremium ? 'PREMIUM' : 'FREE'}
              </Text>
              <Text style={styles.planDescription}>
                {isPremium
                  ? 'すべてのカテゴリを利用中'
                  : 'NEWSカテゴリのみ利用可能'}
              </Text>
            </View>
            {!isPremium && (
              <Pressable
                onPress={() => setShowPremiumSheet(true)}
                style={({ pressed }) => [styles.upgradeBtn, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.upgradeBtnText}>アップグレード</Text>
              </Pressable>
            )}
            {isPremium && (
              <Pressable onPress={() => setPlan('free')}>
                <Text style={styles.downgradeText}>解約（デモ）</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Theme Section */}
        <SectionHeader title="デザイン" />
        <View style={[styles.section, { padding: 16 }]}>
          <View style={{ gap: 12 }}>
            {(['normal', 'cli', '8bit'] as const).map((theme) => (
              <Pressable
                key={theme}
                onPress={() => setDesignTheme(theme)}
                style={({ pressed }) => [
                  styles.themeOption,
                  designTheme === theme && styles.themeOptionActive,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={styles.themeOptionContent}>
                  <View
                    style={[
                      styles.themeIndicator,
                      designTheme === theme && styles.themeIndicatorActive,
                    ]}
                  />
                  <PixelText variant="body">
                    {theme === 'normal' ? 'ノーマル' : theme === 'cli' ? 'CLI' : '8bit'}
                  </PixelText>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Data Source Section */}
        <SectionHeader title="データソース" />
        <View style={styles.section}>
          {getAvailableDataSources().map((source) => (
            <Pressable
              key={source.id}
              onPress={() => handleDataSourceChange(source.id)}
              style={({ pressed }) => [
                styles.dataSourceRow,
                dataSource === source.id && styles.dataSourceRowActive,
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.dataSourceContent}>
                <Text style={[styles.dataSourceLabel, dataSource === source.id && styles.dataSourceLabelActive]}>
                  {source.label}
                </Text>
                <Text style={styles.dataSourceDesc}>{source.description}</Text>
              </View>
              {dataSource === source.id && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
          ))}
        </View>

        {/* App Section */}
        <SectionHeader title="アプリ情報" />
        <View style={styles.section}>
          <SettingRow label="バージョン" value={APP_VERSION} />
          <View style={styles.divider} />
          <SettingRow label="プライバシーポリシー" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingRow label="利用規約" onPress={() => {}} />
        </View>

        {/* About Section */}
        <SectionHeader title="Swellについて" />
        <View style={styles.section}>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutLogo}>SWELL</Text>
            <Text style={styles.aboutTagline}>ニュースを読む前に、波を見る</Text>
            <Text style={styles.aboutDescription}>
              Swellは、ニュース・SNS・市況の話題を「波」で可視化するウィジェットファーストのアプリです。
              話題の温度感を素早く把握することを目的としています。
            </Text>
          </View>
        </View>

        {/* Wave Legend */}
        <SectionHeader title="波の見方" />
        <View style={styles.section}>
          <View style={styles.legendSection}>
            <Text style={styles.legendSectionTitle}>波の高さ（話題性）</Text>
            {[
              { label: '小波', desc: '静かな話題' },
              { label: '通常波', desc: '注目の話題' },
              { label: '高波', desc: '大きなうねり' },
            ].map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <Text style={styles.legendItemLabel}>{item.label}</Text>
                <Text style={styles.legendItemDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
          <View style={styles.divider} />
          <View style={styles.legendSection}>
            <Text style={styles.legendSectionTitle}>波の色（反応傾向）</Text>
            {[
              { color: '#3B82F6', label: '青', desc: '中立' },
              { color: '#10B981', label: '緑', desc: '好意的' },
              { color: '#F59E0B', label: '黄', desc: '賛否割れ' },
              { color: '#EF4444', label: '赤', desc: '反対・炎上' },
            ].map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendItemLabel}>{item.label}</Text>
                <Text style={styles.legendItemDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {showPremiumSheet && (
        <PremiumSheet onClose={() => setShowPremiumSheet(false)} />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerTitle: {
    color: '#E8EDF5',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionHeaderText: {
    color: '#4B5563',
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 2,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 4,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLabel: {
    flex: 1,
    color: '#E8EDF5',
    fontSize: 14,
  },
  settingLabelAccent: {
    color: '#A78BFA',
  },
  settingValue: {
    color: '#6B7280',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  chevron: {
    color: '#4B5563',
    fontSize: 18,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  planCardLeft: {
    flex: 1,
    gap: 4,
  },
  planBadge: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: 2,
  },
  planBadgeFree: {
    color: '#6B7280',
  },
  planBadgePremium: {
    color: '#A78BFA',
  },
  planDescription: {
    color: '#6B7280',
    fontSize: 12,
  },
  upgradeBtn: {
    backgroundColor: '#A78BFA',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 2,
  },
  upgradeBtnText: {
    color: '#0A0E1A',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  downgradeText: {
    color: '#4B5563',
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  aboutCard: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  aboutLogo: {
    color: '#E8EDF5',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 6,
  },
  aboutTagline: {
    color: '#4B5563',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  aboutDescription: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  legendSection: {
    padding: 16,
    gap: 10,
  },
  legendSectionTitle: {
    color: '#6B7280',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 0,
  },
  legendItemLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'monospace',
    width: 48,
  },
  legendItemDesc: {
    color: '#6B7280',
    fontSize: 12,
  },
  dataSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  dataSourceRowActive: {
    backgroundColor: '#0F1419',
  },
  dataSourceContent: {
    flex: 1,
    gap: 4,
  },
  dataSourceLabel: {
    color: '#E8EDF5',
    fontSize: 14,
    fontWeight: '600',
  },
  dataSourceLabelActive: {
    color: '#3B82F6',
  },
  dataSourceDesc: {
    color: '#6B7280',
    fontSize: 12,
  },
  checkmark: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '700',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 2,
  },
  themeOptionActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#0F1419',
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4B5563',
  },
  themeIndicatorActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
});
