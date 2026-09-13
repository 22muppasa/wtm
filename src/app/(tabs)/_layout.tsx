import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Tabs, router, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/theme';
import { T, tap } from '@/components/ui';

const items = [
  { name: 'home', label: 'Home', icon: 'home' },
  { name: 'explore', label: 'Explore', icon: 'search' },
  { name: 'log', label: 'Snap', icon: 'camera' },
  { name: 'crews', label: 'Crews', icon: 'users' },
  { name: 'you', label: 'You', icon: 'user' },
] as const;

function BottomTabs() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const path = usePathname();
  return <View style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 8), backgroundColor: colors.background, borderTopColor: colors.border }]}>
    {Platform.OS === 'ios' ? <BlurView tint="systemMaterialLight" intensity={78} style={StyleSheet.absoluteFill} /> : null}
    <View style={styles.row}>{items.map(item => {
      const active = path.endsWith(item.name);
      const snap = item.name === 'log';
      return <Pressable key={item.name} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: active }} onPress={() => { tap(); if (snap) router.push('/camera?from=tab'); else router.navigate(`/(tabs)/${item.name}`); }} style={styles.item}>
        <View style={[snap ? styles.snap : styles.icon, snap ? { backgroundColor: colors.accent, borderColor: colors.background } : undefined]}><Feather name={item.icon} size={snap ? 23 : 20} color={snap ? colors.white : active ? colors.accentPressed : colors.textSecondary} /></View>
        <T variant="caption" color={snap || active ? colors.accentPressed : colors.textSecondary} style={styles.label}>{item.label}</T>
      </Pressable>;
    })}</View>
  </View>;
}

export default function TabLayout() {
  const { colors } = useTheme();
  return <Tabs tabBar={() => <BottomTabs />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}><Tabs.Screen name="home" /><Tabs.Screen name="explore" /><Tabs.Screen name="crews" /><Tabs.Screen name="you" /></Tabs>;
}

const styles = StyleSheet.create({
  shell: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, boxShadow: '0 -6px 22px rgba(28,27,26,.04)' },
  row: { height: 66, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8 },
  item: { flex: 1, minHeight: 60, alignItems: 'center', justifyContent: 'flex-end', gap: 3, paddingBottom: 5 },
  icon: { width: 34, height: 30, alignItems: 'center', justifyContent: 'center' },
  snap: { width: 52, height: 52, marginTop: -18, marginBottom: 1, borderRadius: 26, borderWidth: 4, alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(217,67,49,.3)' },
  label: { fontSize: 10, lineHeight: 13, fontWeight: '700' },
});
