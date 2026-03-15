import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '@/lib/theme-context';
import { getAllThemes, ThemeType } from '@/lib/theme-system';
import { cn } from '@/lib/utils';

export function ThemeSelector() {
  const { currentTheme, setTheme } = useTheme();
  const themes = getAllThemes();

  return (
    <View className="gap-4">
      <Text className="text-lg font-semibold text-foreground">デザインテーマ</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
        {themes.map((theme) => (
          <Pressable
            key={theme.name}
            onPress={() => setTheme(theme.name as ThemeType)}
            className={cn(
              'rounded-lg border-2 p-4 min-w-[140px]',
              currentTheme === theme.name
                ? 'border-primary bg-primary/10'
                : 'border-border bg-surface'
            )}
          >
            <Text
              className={cn(
                'text-base font-semibold',
                currentTheme === theme.name ? 'text-primary' : 'text-foreground'
              )}
            >
              {theme.label}
            </Text>
            <Text className="text-xs text-muted mt-2">{theme.description}</Text>

            {currentTheme === theme.name && (
              <View className="mt-3 h-1 bg-primary rounded-full" />
            )}
          </Pressable>
        ))}
      </ScrollView>

      <View className="bg-surface rounded-lg p-4 border border-border">
        <Text className="text-sm text-muted">
          選択したテーマはデバイスに保存されます。アプリを再起動しても設定は保持されます。
        </Text>
      </View>
    </View>
  );
}
