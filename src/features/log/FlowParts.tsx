import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { IconButton, Photo, Sheet, T } from '@/components/ui';
import { useTheme } from '@/theme';
import type { Activity, Move } from '@/types';

type Visibility = Move['visibility'];
type LocationVisibility = Move['locationVisibility'];

export function FlowHeader({ step, total = 4, onBack, onClose }: { step: number; total?: number; onBack: () => void; onClose?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.flowHeader}>
      <IconButton name="arrow-left" onPress={onBack} label="Go back" />
      <View accessibilityLabel={`Step ${step + 1} of ${total}`} style={styles.progress}>
        {Array.from({ length: total }, (_, index) => <View key={index} style={[styles.segment, { backgroundColor: index <= step ? colors.accent : colors.border }]} />)}
      </View>
      {onClose ? <IconButton name="x" label="Close" onPress={onClose} /> : <T variant="caption" color={colors.textSecondary}>{step + 1}/{total}</T>}
    </View>
  );
}

export function FlowEnter({ children, style }: { children: React.ReactNode; style?: React.ComponentProps<typeof Animated.View>['style'] }) {
  const reducedMotion = useReducedMotion();
  return <Animated.View entering={reducedMotion ? FadeIn.duration(130) : FadeInDown.duration(230)} style={style}>{children}</Animated.View>;
}

export function ChoiceCard({ activity, onPress, placeName, subtitle }: { activity: Activity; onPress: () => void; placeName?: string; subtitle?: string }) {
  const { colors, radius } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`I would rather do ${activity.name} again`} onPress={onPress} style={({ pressed }) => [styles.choice, { borderRadius: radius.xl, opacity: pressed ? 0.86 : 1 }]}>
      <Photo image={activity.image} style={styles.choiceImage}>
        <LinearGradient colors={['transparent', colors.overlay]} style={styles.choiceShade}>
          {subtitle ? <T variant="caption" color={colors.white}>{subtitle}</T> : null}
          <T variant="heading" color={colors.white}>{activity.name}</T>
          {placeName || activity.placeName ? <T variant="small" color={colors.white}>{placeName || activity.placeName}</T> : null}
        </LinearGradient>
      </Photo>
    </Pressable>
  );
}

export const visibilityLabels: Record<Visibility, string> = { private: 'Only me', friends: 'Friends', public: 'Public' };
export const locationLabels: Record<LocationVisibility, string> = { exact: 'Exact place', approximate: 'General area', hidden: 'Hidden' };

export function PrivacySheet({ visible, onClose, visibility, locationVisibility, onVisibility, onLocationVisibility }: {
  visible: boolean; onClose: () => void; visibility: Visibility; locationVisibility: LocationVisibility;
  onVisibility: (value: Visibility) => void; onLocationVisibility: (value: LocationVisibility) => void;
}) {
  const { colors } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title="Your move, your choice">
      <T variant="body" color={colors.textSecondary}>Choose who sees this move. Your location has its own setting.</T>
      <T variant="label" style={styles.sheetTitle}>Who can see this?</T>
      {(['private', 'friends', 'public'] as const).map(value => <PrivacyOption key={value} title={visibilityLabels[value]} selected={visibility === value} onPress={() => onVisibility(value)} description={value === 'private' ? 'Just for your own history and taste.' : value === 'friends' ? 'People you follow can see this move.' : 'Visible on your public profile.'} />)}
      <T variant="label" style={styles.sheetTitle}>Location</T>
      {(['exact', 'approximate', 'hidden'] as const).map(value => <PrivacyOption key={value} title={locationLabels[value]} selected={locationVisibility === value} onPress={() => onLocationVisibility(value)} />)}
    </Sheet>
  );
}

export function PrivacyOption({ title, selected, onPress, description }: { title: string; selected: boolean; onPress: () => void; description?: string }) {
  const { colors, radius } = useTheme();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.option, { backgroundColor: selected ? colors.accentSoft : colors.surface, borderRadius: radius.md }]}>
      <View style={styles.flex}><T variant="body">{title}</T>{description ? <T variant="caption" color={colors.textSecondary}>{description}</T> : null}</View>
      <Feather name={selected ? 'check-circle' : 'circle'} size={21} color={selected ? colors.accent : colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, gap: 16 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 164, flex: 1 },
  segment: { height: 5, borderRadius: 4, flex: 1 },
  choice: { overflow: 'hidden', minHeight: 176 },
  choiceImage: { width: '100%', height: 202 },
  choiceShade: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end', padding: 20, gap: 3 },
  sheetTitle: { marginTop: 24, marginBottom: 10 },
  option: { flexDirection: 'row', gap: 16, alignItems: 'center', minHeight: 52, padding: 14, marginBottom: 8 },
  flex: { flex: 1, gap: 3 },
});
