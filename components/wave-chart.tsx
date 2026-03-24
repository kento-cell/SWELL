import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useColors } from '@/hooks/use-colors';

export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  history?: number[]; // 過去の価格データ（オプション）
}

interface WaveChartProps {
  data: StockData;
  width?: number;
  height?: number;
}

/**
 * 株価データを波の高さで表現するコンポーネント
 * 波の高さ = 現在価格の相対位置
 * 波の色 = 上昇（緑）/ 下降（赤）
 */
export function WaveChart({ data, width = 300, height = 120 }: WaveChartProps) {
  const colors = useColors();
  
  // 価格データから波のパスを生成
  const waveData = useMemo(() => {
    const priceHistory = data.history || generateMockHistory(data);
    
    // 正規化：価格を0-1の範囲に変換
    const minPrice = Math.min(...priceHistory);
    const maxPrice = Math.max(...priceHistory);
    const priceRange = maxPrice - minPrice || 1;
    
    const normalizedPrices = priceHistory.map(p => (p - minPrice) / priceRange);
    
    // SVG パスを生成
    const points = normalizedPrices.map((price, index) => {
      const x = (index / (normalizedPrices.length - 1)) * width;
      const y = height - price * (height * 0.7) - height * 0.15;
      return { x, y, price };
    });
    
    // ベジェ曲線を使用して滑らかな波を生成
    let pathData = `M ${points[0].x} ${height}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX1 = current.x + (next.x - current.x) / 3;
      const controlX2 = current.x + (next.x - current.x) * 2 / 3;
      
      pathData += ` C ${controlX1} ${current.y} ${controlX2} ${next.y} ${next.x} ${next.y}`;
    }
    
    // 波を閉じる
    pathData += ` L ${width} ${height} Z`;
    
    return {
      pathData,
      currentPrice: data.price,
      isPositive: data.change >= 0,
      changePercent: data.changePercent,
    };
  }, [data, width, height]);
  
  // 上昇/下降に応じた色を決定
  const waveColor = waveData.isPositive ? colors.success : colors.error;
  const waveColorDark = waveData.isPositive ? '#10B981' : '#EF4444';
  
  return (
    <View className="gap-3">
      {/* 波チャート */}
      <View className="bg-surface rounded-lg p-3 overflow-hidden">
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            <LinearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={waveColor} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={waveColor} stopOpacity="0.05" />
            </LinearGradient>
          </Defs>
          
          {/* 波の背景グラデーション */}
          <Path
            d={waveData.pathData}
            fill="url(#waveGradient)"
            stroke={waveColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      
      {/* 株価情報 */}
      <View className="flex-row items-center justify-between px-3">
        <View className="gap-1">
          <Text className="text-sm text-muted">{data.symbol}</Text>
          <Text className="text-lg font-bold text-foreground">
            ¥{data.price.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}
          </Text>
        </View>
        
        <View className="items-end gap-1">
          <Text
            className={`text-sm font-semibold ${
              waveData.isPositive ? 'text-success' : 'text-error'
            }`}
          >
            {waveData.isPositive ? '+' : ''}{data.change.toFixed(2)}
          </Text>
          <Text
            className={`text-xs ${
              waveData.isPositive ? 'text-success' : 'text-error'
            }`}
          >
            {waveData.isPositive ? '+' : ''}{waveData.changePercent.toFixed(2)}%
          </Text>
        </View>
      </View>
      
      {/* 高値・安値 */}
      <View className="flex-row justify-between px-3 text-xs text-muted">
        <Text className="text-xs text-muted">
          高: ¥{data.high.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}
        </Text>
        <Text className="text-xs text-muted">
          安: ¥{data.low.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}
        </Text>
      </View>
    </View>
  );
}

/**
 * テスト用のモック価格履歴を生成
 */
function generateMockHistory(data: StockData): number[] {
  const basePrice = data.price;
  const volatility = Math.abs(data.change) * 0.5;
  const points = 20;
  const history: number[] = [];
  
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const randomWalk = (Math.random() - 0.5) * volatility * 2;
    const trend = data.change * progress;
    const price = basePrice - data.change + trend + randomWalk;
    history.push(Math.max(data.low, Math.min(data.high, price)));
  }
  
  return history;
}
