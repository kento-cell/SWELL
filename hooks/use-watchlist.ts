/**
 * ユーザーウォッチリスト管理フック
 *
 * AsyncStorageにユーザーが追加した銘柄シンボルを保存・取得する。
 * コスト0（端末ローカル保存）。
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'swell_watchlist';

export interface WatchlistSymbol {
  symbol: string;     // e.g. 'AAPL', '7203.T'
  name: string;       // e.g. 'Apple Inc.', 'トヨタ自動車'
  exchange?: string;   // e.g. 'NASDAQ', 'TSE'
  group?: string;     // 自動推定: '暗号通貨', '投資信託', '米国株' etc.
}

/**
 * シンボルからグループを自動推定
 */
export function detectGroup(symbol: string, type?: string): string {
  if (symbol.endsWith('-USD') || symbol.endsWith('-JPY') || type === 'CRYPTOCURRENCY') return '暗号通貨';
  if (symbol.endsWith('=X')) return '為替';
  if (symbol.endsWith('=F')) return 'コモディティ';
  if (symbol.startsWith('^')) return '主要指標';
  // ETF (投資信託連動)
  const etfSymbols = ['VT','VOO','VTI','QQQ','VWO','VYM','VEA','VXUS','VGT','ARKK','HDV','SCHD','IVV','SPY','AGG','BND','INDA','EEM','EFA','VNQ'];
  if (etfSymbols.includes(symbol) || type === 'ETF') return '投資信託';
  if (symbol.endsWith('.T')) return '日本株';
  return '米国株';
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistSymbol[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 初回読み込み
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((data) => {
        if (data) {
          setWatchlist(JSON.parse(data));
        }
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, []);

  // 保存
  const save = useCallback(async (list: WatchlistSymbol[]) => {
    setWatchlist(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, []);

  // 追加（maxLimitを超える場合はfalseを返す）
  const addSymbol = useCallback(async (item: WatchlistSymbol, maxLimit?: number) => {
    const exists = watchlist.some((w) => w.symbol === item.symbol);
    if (exists) return true;
    if (maxLimit !== undefined && watchlist.length >= maxLimit) return false;
    const updated = [...watchlist, item];
    await save(updated);
    return true;
  }, [watchlist, save]);

  // 削除
  const removeSymbol = useCallback(async (symbol: string) => {
    const updated = watchlist.filter((w) => w.symbol !== symbol);
    await save(updated);
  }, [watchlist, save]);

  // 存在チェック
  const hasSymbol = useCallback((symbol: string) => {
    return watchlist.some((w) => w.symbol === symbol);
  }, [watchlist]);

  return {
    watchlist,
    isLoaded,
    addSymbol,
    removeSymbol,
    hasSymbol,
  };
}
