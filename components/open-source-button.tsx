import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { openInBrowser } from '@/lib/browser-utils';

interface OpenSourceButtonProps {
  url?: string;
  label?: string;
  onPress?: () => void;
}

/**
 * Button to open news source URL in browser
 * Famicom 8-bit style
 */
export function OpenSourceButton({
  url,
  label = '元記事を開く',
  onPress,
}: OpenSourceButtonProps) {
  const handlePress = async () => {
    if (onPress) {
      onPress();
    } else if (url) {
      await openInBrowser(url);
    }
  };

  const isDisabled = !url && !onPress;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled && styles.buttonPressed,
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>
          {label}
        </Text>
        <Text style={[styles.icon, isDisabled && styles.labelDisabled]}>→</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E74C3C',
    borderWidth: 2,
    borderColor: '#C0392B',
    borderRadius: 0, // Pixel perfect
  },
  buttonPressed: {
    backgroundColor: '#C0392B',
    transform: [{ scale: 0.97 }],
  },
  buttonDisabled: {
    backgroundColor: '#555555',
    borderColor: '#333333',
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    color: '#F0F0F0',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  labelDisabled: {
    color: '#999999',
  },
  icon: {
    color: '#F0F0F0',
    fontSize: 16,
    fontWeight: '700',
  },
});
