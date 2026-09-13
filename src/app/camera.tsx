import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button, CubeMark, T } from '@/components/ui';
import { useUIStore } from '@/stores/ui';
import { useTheme } from '@/theme';

export default function CameraScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturing, setCapturing] = useState(false);
  const setCameraDraftUri = useUIStore(state => state.setCameraDraftUri);

  const capture = async () => {
    if (!camera.current || capturing) return;
    setCapturing(true);
    try {
      const picture = await camera.current.takePictureAsync({ quality: 0.82, skipProcessing: false });
      if (picture?.uri) {
        setCameraDraftUri(picture.uri);
        void Haptics.notificationAsync();
        if (from === 'tab') router.replace('/log'); else router.back();
      }
    } finally { setCapturing(false); }
  };

  if (!permission) return <View style={[styles.permission, { backgroundColor: colors.ink }]}><ActivityIndicator color={colors.accent} /><T color={colors.white}>Opening camera…</T></View>;
  if (!permission.granted) return <View style={[styles.permission, { backgroundColor: colors.background }]}><CubeMark size={76} /><T variant="title" style={styles.center}>Snap the Move.</T><T color={colors.textSecondary} style={styles.permissionCopy}>WTM uses your camera only when you choose to capture a memory.</T><Button title="Allow camera" icon="camera" onPress={() => { void requestPermission(); }} /><Button title="Not now" variant="ghost" onPress={() => router.back()} /></View>;

  return <View style={styles.root}>
    <CameraView ref={camera} style={StyleSheet.absoluteFill} facing={facing}>
      <View style={styles.shade} />
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close camera" onPress={() => router.back()} style={styles.roundButton}><Feather name="x" size={24} color="#fff" /></Pressable>
        <View style={styles.cameraBrand}><CubeMark size={30} /><T variant="label" color="#fff">Capture a Move</T></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Use ${facing === 'back' ? 'front' : 'rear'} camera`} onPress={() => setFacing(value => value === 'back' ? 'front' : 'back')} style={styles.roundButton}><Feather name="refresh-cw" size={21} color="#fff" /></Pressable>
      </View>
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}>
        <T variant="small" color="#fff">Rear camera is the default. Point, snap, keep moving.</T>
        <Pressable accessibilityRole="button" accessibilityLabel="Take photo" disabled={capturing} onPress={() => { void capture(); }} style={[styles.shutterOuter, { opacity: capturing ? 0.55 : 1 }]}><View style={styles.shutterInner} /></Pressable>
      </View>
    </CameraView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' }, shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,.1)' },
  top: { paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, cameraBrand: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: 'rgba(0,0,0,.34)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  roundButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.42)' },
  bottom: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', gap: 18, paddingHorizontal: 24 }, shutterOuter: { width: 82, height: 82, borderRadius: 41, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }, shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
  permission: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 18 }, permissionCopy: { textAlign: 'center', maxWidth: 320, lineHeight: 23 }, center: { textAlign: 'center' },
});
