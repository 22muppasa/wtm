import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button, LogoMark, T } from '@/components/ui';
import { useUIStore } from '@/stores/ui';
import { useAppStore } from '@/stores/app';
import { useTheme } from '@/theme';
import type { ActivityCategory } from '@/types';

const quickTags: Array<{ key: ActivityCategory; label: string; emoji: string }> = [
  { key: 'nightlife', label: 'Nightlife', emoji: '🎳' },
  { key: 'food', label: 'Eats', emoji: '🍕' },
  { key: 'active', label: 'Active', emoji: '🧗' },
  { key: 'chill', label: 'Chill', emoji: '🎧' },
];

export default function CameraScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [tag, setTag] = useState<ActivityCategory>('nightlife');
  const [capturing, setCapturing] = useState(false);
  const setCameraDraftUri = useUIStore(state => state.setCameraDraftUri);
  const setCameraDraftCategory = useUIStore(state => state.setCameraDraftCategory);
  const queued = useAppStore(state => state.moves.filter(move => move.userId === 'shawn' && move.photo && !move.ratings).length);

  const capture = async () => {
    if (!camera.current || capturing) return;
    setCapturing(true);
    try {
      const picture = await camera.current.takePictureAsync({ quality: 0.82, skipProcessing: false });
      if (picture?.uri) {
        setCameraDraftUri(picture.uri);
        setCameraDraftCategory(tag);
        void Haptics.notificationAsync();
        if (from === 'tab') router.replace('/log'); else router.back();
      }
    } finally { setCapturing(false); }
  };

  if (!permission) return <View style={[styles.permission, { backgroundColor: colors.ink }]}><ActivityIndicator color={colors.accent} /><T color={colors.white}>Opening camera…</T></View>;
  if (!permission.granted) return <View style={[styles.permission, { backgroundColor: colors.background }]}><LogoMark size={76} /><T variant="title" style={styles.center}>Snap the Move.</T><T color={colors.textSecondary} style={styles.permissionCopy}>WTM uses your camera only when you choose to capture a memory.</T><Button title="Allow camera" icon="camera" onPress={() => { void requestPermission(); }} /><Button title="Not now" variant="ghost" onPress={() => router.back()} /></View>;

  return <View style={styles.root}>
    <CameraView ref={camera} style={StyleSheet.absoluteFill} facing={facing}>
      <View style={styles.shade} />
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close camera" onPress={() => router.back()} style={styles.roundButton}><Feather name="x" size={24} color="#fff" /></Pressable>
        <View style={styles.cameraBrand}><LogoMark size={28} /><View><T variant="caption" color="#fff" style={styles.eyebrow}>WTM CAMERA</T><T variant="caption" color="rgba(255,255,255,.72)">Rear lens</T></View></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Use ${facing === 'back' ? 'front' : 'rear'} camera`} onPress={() => setFacing(value => value === 'back' ? 'front' : 'back')} style={styles.roundButton}><Feather name="refresh-cw" size={21} color="#fff" /></Pressable>
      </View>
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${queued} photos waiting in queue`} onPress={() => router.push('/queue')} style={styles.queuePill}><Feather name="clock" size={15} color="#fff" /><T variant="caption" color="#fff">HOME QUEUE · {queued} WAITING</T><Feather name="arrow-right" size={15} color="#fff" /></Pressable>
        <T variant="small" color="#fff">Point away. Snap now. Rate it when you get home.</T>
        <Pressable accessibilityRole="button" accessibilityLabel="Take photo" disabled={capturing} onPress={() => { void capture(); }} style={[styles.shutterOuter, { opacity: capturing ? 0.55 : 1 }]}><View style={styles.shutterInner} /></Pressable>
        <View style={styles.quickDrawer}><View style={styles.drawerCopy}><Feather name="zap" size={15} color="#CBF230" /><T variant="caption" color="#fff">Quick-tag the vibe</T></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagRail}>{quickTags.map(item => { const selected = item.key === tag; return <Pressable key={item.key} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setTag(item.key)} style={[styles.tag, { backgroundColor: selected ? '#FF5B49' : 'rgba(255,255,255,.12)' }]}><T variant="caption" color="#fff">{item.emoji} {item.label}</T></Pressable>; })}</ScrollView></View>
      </View>
    </CameraView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' }, shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,.1)' },
  eyebrow: { fontWeight: '800', letterSpacing: .7 }, top: { paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, cameraBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roundButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.42)' },
  bottom: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', gap: 16, paddingHorizontal: 18 }, queuePill: { minHeight: 34, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.52)', flexDirection: 'row', gap: 8, alignItems: 'center' }, shutterOuter: { width: 82, height: 82, borderRadius: 41, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(255,91,73,.45)' }, shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', borderWidth: 5, borderColor: '#FF5B49' }, quickDrawer: { width: '100%', borderRadius: 14, backgroundColor: 'rgba(25,24,22,.82)', padding: 12, gap: 9 }, drawerCopy: { flexDirection: 'row', alignItems: 'center', gap: 6 }, tagRail: { gap: 8 }, tag: { minHeight: 34, borderRadius: 999, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  permission: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 18 }, permissionCopy: { textAlign: 'center', maxWidth: 320, lineHeight: 23 }, center: { textAlign: 'center' },
});
