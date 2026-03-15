import React from 'react';
import { Pressable, StyleSheet, Text, View, Image, useWindowDimensions } from 'react-native';
import { VideoData } from '@/server/api/data-router';

interface VideoCardProps {
  video: VideoData;
  onPress: () => void;
}

export function VideoCard({ video, onPress }: VideoCardProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 32, 400);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && styles.pressed]}
    >
      {/* Thumbnail */}
      <View style={[styles.thumbnailContainer, { width: cardWidth - 2 }]}>
        {video.thumbnail ? (
          <Image
            source={{ uri: video.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <Text style={styles.placeholderText}>🎥</Text>
          </View>
        )}

        {/* Source badge */}
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceBadgeText}>
            {video.source === 'youtube' ? '▶ YouTube' : '🎵 TikTok'}
          </Text>
        </View>

        {/* Duration (if available) */}
        {video.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{video.duration}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>👁</Text>
            <Text style={styles.statValue}>{video.views}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>❤</Text>
            <Text style={styles.statValue}>{video.likes}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {video.description}
        </Text>

        {/* Tap hint */}
        <Text style={styles.tapHint}>タップで動画を開く →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  pressed: {
    opacity: 0.7,
  },
  thumbnailContainer: {
    position: 'relative',
    height: 180,
    backgroundColor: '#111827',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#374151',
  },
  placeholderText: {
    fontSize: 48,
  },
  sourceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sourceBadgeText: {
    color: '#ECEDEE',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  durationText: {
    color: '#ECEDEE',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  content: {
    padding: 12,
    gap: 8,
  },
  title: {
    color: '#ECEDEE',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    color: '#9BA1A6',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  description: {
    color: '#9BA1A6',
    fontSize: 12,
    lineHeight: 16,
  },
  tapHint: {
    color: '#687076',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 4,
  },
});
