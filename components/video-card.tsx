/**
 * VideoCard — SOCIAL カテゴリ用の動画カードコンポーネント
 *
 * YouTube: WebView で iframe 埋め込み再生（アプリ内）
 * TikTok: サムネイル表示 → タップで外部ブラウザ（TikTok は iframe 埋め込み不可）
 */

import React, { useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { Topic } from '@/lib/types';
import { useThemeContext } from '@/lib/theme-provider';

interface VideoCardProps {
  topic: Topic;
  cardWidth: number;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_HEIGHT = Math.min(SCREEN_HEIGHT * 0.28, 220);

/**
 * YouTube iframe HTML for WebView
 */
function buildYouTubeHTML(videoId: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; overflow: hidden; }
    .container { position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; }
    iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <div class="container">
    <iframe
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  </div>
</body>
</html>`;
}

export function VideoCard({ topic, cardWidth }: VideoCardProps) {
  const { themeConfig } = useThemeContext();
  const tc = themeConfig.colors;
  const [isPlaying, setIsPlaying] = useState(false);

  const isYouTube = topic.videoType === 'youtube';
  const isTikTok = topic.videoType === 'tiktok';

  const handlePress = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (isYouTube && topic.videoId) {
      // YouTube: toggle WebView player
      setIsPlaying((prev) => !prev);
    } else if (topic.sourceUrl) {
      // TikTok or fallback: open in browser
      await WebBrowser.openBrowserAsync(topic.sourceUrl);
    }
  };

  const waveColor = getWaveColor(topic.waveSentiment);

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: tc.surface,
        borderColor: tc.border,
        borderRadius: themeConfig.borderRadius.sm,
        width: cardWidth,
      },
    ]}>
      {/* Video area */}
      <View style={[styles.videoArea, { height: VIDEO_HEIGHT }]}>
        {isPlaying && isYouTube && topic.videoId ? (
          // YouTube WebView player
          <WebView
            source={{ html: buildYouTubeHTML(topic.videoId) }}
            style={styles.webView}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
          />
        ) : (
          // Thumbnail with play button overlay
          <Pressable
            onPress={handlePress}
            style={({ pressed }) => [styles.thumbnailContainer, pressed && { opacity: 0.85 }]}
          >
            {topic.thumbnail ? (
              <Image
                source={{ uri: topic.thumbnail }}
                style={styles.thumbnail}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />
            ) : (
              <View style={[styles.thumbnailPlaceholder, { backgroundColor: tc.background }]}>
                <Text style={[styles.thumbnailPlaceholderIcon, { color: tc.muted }]}>
                  {isYouTube ? '▶' : '♪'}
                </Text>
              </View>
            )}

            {/* Play button overlay */}
            <View style={styles.playOverlay}>
              <View style={[styles.playButton, {
                backgroundColor: isYouTube ? 'rgba(255,0,0,0.9)' : 'rgba(0,0,0,0.85)',
              }]}>
                <Text style={styles.playIcon}>
                  {isYouTube ? '▶' : '↗'}
                </Text>
              </View>
            </View>

            {/* Duration badge */}
            {topic.duration && (
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{topic.duration}</Text>
              </View>
            )}

            {/* Source badge */}
            <View style={styles.sourceBadgeContainer}>
              <View style={[styles.sourceBadge, {
                backgroundColor: isYouTube ? '#FF0000' : '#000000',
              }]}>
                <Text style={styles.sourceBadgeText}>
                  {isYouTube ? '▶ YouTube' : '♪ TikTok'}
                </Text>
              </View>
            </View>
          </Pressable>
        )}

        {/* Close button when playing */}
        {isPlaying && (
          <Pressable
            onPress={() => setIsPlaying(false)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Info area */}
      <View style={styles.infoArea}>
        {/* Title */}
        <Text
          style={[styles.title, { color: tc.foreground }]}
          numberOfLines={2}
        >
          {topic.title}
        </Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          {topic.views && (
            <Text style={[styles.metaText, { color: tc.muted }]}>
              👁 {topic.views}
            </Text>
          )}
          {isTikTok && (
            <Text style={[styles.tiktokNote, { color: tc.muted }]}>
              ↗ タップで開く
            </Text>
          )}
        </View>

        {/* Wave indicator */}
        <View style={styles.waveRow}>
          <View style={[styles.waveDot, { backgroundColor: waveColor }]} />
          <Text style={[styles.waveText, { color: tc.muted }]}>
            {getWaveLabel(topic.waveLevel)} · {getSentimentLabel(topic.waveSentiment)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function getWaveColor(sentiment: string): string {
  switch (sentiment) {
    case 'green': return '#10B981';
    case 'yellow': return '#F59E0B';
    case 'red': return '#EF4444';
    default: return '#3B82F6';
  }
}

function getWaveLabel(level: string): string {
  switch (level) {
    case 'high': return '高波';
    case 'low': return '小波';
    default: return '通常波';
  }
}

function getSentimentLabel(sentiment: string): string {
  switch (sentiment) {
    case 'green': return '好意的';
    case 'yellow': return '賛否割れ';
    case 'red': return '炎上';
    default: return '中立';
  }
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 4,
  },
  videoArea: {
    position: 'relative',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  thumbnailContainer: {
    flex: 1,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPlaceholderIcon: {
    fontSize: 48,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: '#fff',
    fontSize: 20,
    marginLeft: 2,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  sourceBadgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
  },
  sourceBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  infoArea: {
    padding: 12,
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  tiktokNote: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontStyle: 'italic',
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waveDot: {
    width: 8,
    height: 8,
    borderRadius: 0,
  },
  waveText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
});
