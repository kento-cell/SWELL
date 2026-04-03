/**
 * 銘柄追加・管理モーダル
 *
 * - 銘柄検索（Yahoo Finance）
 * - ウォッチリストへの追加/削除
 * - テーマ対応、Pressableはstyleプロップ使用
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useThemeContext } from '@/lib/theme-provider';
import { trpc } from '@/lib/trpc';
import { useWatchlist, WatchlistSymbol, detectGroup } from '@/hooks/use-watchlist';

interface WatchlistModalProps {
  visible: boolean;
  onClose: () => void;
}

export function WatchlistModal({ visible, onClose }: WatchlistModalProps) {
  const { themeConfig } = useThemeContext();
  const tc = themeConfig.colors;
  const { watchlist, addSymbol, removeSymbol, hasSymbol } = useWatchlist();
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // 検索クエリ（2文字以上で発火）
  const searchQuery = trpc.data.searchSymbol.useQuery(query, {
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  });

  const handleAdd = useCallback((item: { symbol: string; name: string; exchange: string; type?: string }) => {
    const group = detectGroup(item.symbol, item.type);
    addSymbol({ symbol: item.symbol, name: item.name, exchange: item.exchange, group });
    setQuery('');
    setShowSearch(false);
  }, [addSymbol]);

  const handleRemove = useCallback((symbol: string) => {
    removeSymbol(symbol);
  }, [removeSymbol]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.container, { backgroundColor: tc.surface, borderColor: tc.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: tc.foreground }]}>銘柄管理</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.6 : 1, backgroundColor: tc.border }]}
            >
              <Text style={[styles.closeBtnText, { color: tc.foreground }]}>✕</Text>
            </Pressable>
          </View>

          {/* Search */}
          <View style={[styles.searchBox, { borderColor: tc.border }]}>
            <TextInput
              value={query}
              onChangeText={(t) => { setQuery(t); setShowSearch(true); }}
              placeholder="検索（例: BTC, オルカン, VT, トヨタ）"
              placeholderTextColor={tc.muted}
              style={[styles.searchInput, { color: tc.foreground }]}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          {/* Search Results */}
          {showSearch && query.length >= 2 && (
            <View style={[styles.searchResults, { borderColor: tc.border }]}>
              {searchQuery.isLoading ? (
                <ActivityIndicator color={tc.accent} style={{ padding: 12 }} />
              ) : (searchQuery.data?.results || []).length === 0 ? (
                <Text style={[styles.emptyText, { color: tc.muted }]}>見つかりません</Text>
              ) : (
                <FlatList
                  data={searchQuery.data?.results || []}
                  keyExtractor={(item) => item.symbol}
                  style={{ maxHeight: 200 }}
                  renderItem={({ item }) => {
                    const added = hasSymbol(item.symbol);
                    return (
                      <Pressable
                        onPress={() => !added && handleAdd(item)}
                        style={({ pressed }) => [
                          styles.resultRow,
                          { borderBottomColor: tc.border, opacity: pressed ? 0.7 : 1 },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.resultSymbol, { color: tc.foreground }]}>{item.symbol}</Text>
                            <View style={[styles.typeBadge, { backgroundColor: tc.border }]}>
                              <Text style={[styles.typeText, { color: tc.muted }]}>
                                {detectGroup(item.symbol, item.type)}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.resultName, { color: tc.muted }]} numberOfLines={1}>
                            {item.name} · {item.exchange}
                          </Text>
                        </View>
                        <Text style={[styles.addBtnText, { color: added ? tc.muted : tc.accent }]}>
                          {added ? '追加済み' : '+ 追加'}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              )}
            </View>
          )}

          {/* Current Watchlist */}
          <Text style={[styles.sectionTitle, { color: tc.muted }]}>ウォッチリスト</Text>
          {watchlist.length === 0 ? (
            <Text style={[styles.emptyText, { color: tc.muted }]}>
              銘柄を検索して追加してください
            </Text>
          ) : (
            <FlatList
              data={watchlist}
              keyExtractor={(item) => item.symbol}
              style={{ flex: 1 }}
              renderItem={({ item }) => (
                <View style={[styles.watchlistRow, { borderBottomColor: tc.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultSymbol, { color: tc.foreground }]}>{item.symbol}</Text>
                    <Text style={[styles.resultName, { color: tc.muted }]} numberOfLines={1}>
                      {item.name}{item.exchange ? ` · ${item.exchange}` : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleRemove(item.symbol)}
                    style={({ pressed }) => [styles.removeBtn, { opacity: pressed ? 0.6 : 1, backgroundColor: 'rgba(239,68,68,0.15)' }]}
                  >
                    <Text style={styles.removeBtnText}>削除</Text>
                  </Pressable>
                </View>
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchBox: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    height: 40,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  searchResults: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  resultSymbol: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  resultName: {
    fontSize: 11,
    marginTop: 1,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  watchlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
