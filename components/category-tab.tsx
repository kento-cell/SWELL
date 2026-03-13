import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Category, CATEGORY_LABEL, FREE_CATEGORIES, PlanType } from '@/lib/types';
import Svg, { Rect } from 'react-native-svg';

// Tiny pixel lock icon for tab
function TinyLock({ color = '#A78BFA' }: { color?: string }) {
  const p = 2;
  const pixels = [
    { r: 0, c: 1 }, { r: 0, c: 2 },
    { r: 1, c: 0 }, { r: 1, c: 3 },
    { r: 2, c: 0 }, { r: 2, c: 3 },
    { r: 3, c: 0 }, { r: 3, c: 1 }, { r: 3, c: 2 }, { r: 3, c: 3 },
    { r: 4, c: 0 }, { r: 4, c: 3 },
    { r: 5, c: 0 }, { r: 5, c: 1 }, { r: 5, c: 2 }, { r: 5, c: 3 },
  ];
  return (
    <Svg width={8} height={12}>
      {pixels.map((px, i) => (
        <Rect key={i} x={px.c * p} y={px.r * p} width={p - 0.5} height={p - 0.5} fill={color} />
      ))}
    </Svg>
  );
}

interface CategoryTabProps {
  categories: Category[];
  activeCategory: Category;
  plan: PlanType;
  onSelect: (category: Category) => void;
}

export function CategoryTab({ categories, activeCategory, plan, onSelect }: CategoryTabProps) {
  return (
    <View style={styles.container}>
      {categories.map((cat) => {
        const isActive = cat === activeCategory;
        const isLocked = plan === 'free' && !FREE_CATEGORIES.includes(cat);

        return (
          <Pressable
            key={cat}
            onPress={() => onSelect(cat)}
            style={({ pressed }) => [
              styles.tab,
              isActive && styles.tabActive,
              pressed && styles.tabPressed,
            ]}
          >
            <View style={styles.tabInner}>
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.tabTextActive,
                  isLocked && styles.tabTextLocked,
                ]}
              >
                {CATEGORY_LABEL[cat]}
              </Text>
              {isLocked && (
                <View style={styles.lockIcon}>
                  <TinyLock color="#A78BFA" />
                </View>
              )}
            </View>
            {isActive && <View style={styles.activeBar} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    backgroundColor: '#0A0E1A',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {},
  tabPressed: {
    opacity: 0.7,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabText: {
    color: '#4B5563',
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  tabTextActive: {
    color: '#E8EDF5',
  },
  tabTextLocked: {
    color: '#6B7280',
  },
  lockIcon: {
    marginTop: 1,
  },
  activeBar: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: '#3B82F6',
  },
});
