import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { T } from '@/components/ui';
import { useTheme } from '@/theme';
import { activities, users, currentUserId } from '@/data/seed';
import { calculateTaste } from '@/services/engine';
import type { Crew, Move, TasteVector } from '@/types';

export const axes: { key: keyof TasteVector; title: string; low: string; high: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'effort', title: 'Effort', low: 'Easygoing', high: 'All in', icon: 'activity' },
  { key: 'novelty', title: 'Novelty', low: 'Familiar favorites', high: 'First times', icon: 'sunrise' },
  { key: 'obscurity', title: 'Discovery', low: 'The classics', high: 'Hidden gems', icon: 'compass' },
  { key: 'spontaneity', title: 'Spontaneity', low: 'Plan ahead', high: 'Go with it', icon: 'wind' },
  { key: 'social', title: 'Social', low: 'Solo time', high: 'Together', icon: 'users' },
  { key: 'rawness', title: 'Rawness', low: 'Creature comforts', high: 'Off the beaten path', icon: 'sun' },
];
export const mine = (moves: Move[]) => moves.filter(m => m.userId === currentUserId);
export const personalTaste = (moves: Move[]) => calculateTaste(mine(moves), activities);
export const memberVectors = (crew: Crew, moves: Move[]) => crew.memberIds.map(id => id === currentUserId ? personalTaste(moves) : users.find(u => u.id === id)?.taste).filter((v): v is TasteVector => !!v);
export const nameOf = (id: string) => users.find(u => u.id === id)?.displayName.split(' ')[0] ?? 'Friend';
export const activityOf = (id: string) => activities.find(a => a.id === id);
export const dateLabel = (date: string) => {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
export const scheduleLabel = (date: string) => {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export function Panel({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[s.panel, { borderColor: colors.border }, style]}>{children}</View>;
}
export function Badge({ children, kind = 'success' }: { children: React.ReactNode; kind?: 'success' | 'accent' | 'neutral' }) {
  const { colors } = useTheme();
  const color = kind === 'success' ? colors.success : kind === 'accent' ? colors.accent : colors.textSecondary;
  const backgroundColor = kind === 'success' ? colors.successSoft : kind === 'accent' ? colors.accentSoft : colors.surfaceAlt;
  return <View style={[s.badge, { backgroundColor }]}><T variant="label" color={color}>{children}</T></View>;
}
export function Metric({ value, label, onPress }: { value: string | number; label: string; onPress?: () => void }) {
  return <Pressable disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={s.metric}><T variant="heading">{value}</T><T variant="caption">{label}</T></Pressable>;
}
export function RowLink({ title, subtitle, icon, onPress, right }: { title: string; subtitle?: string; icon?: keyof typeof Feather.glyphMap; onPress: () => void; right?: React.ReactNode }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={[s.rowLink, { borderBottomColor: colors.border }]}>
    {icon && <View style={s.iconWrap}><Feather name={icon} size={19} color={colors.accentPressed} /></View>}
    <View style={s.flex}><T variant="label">{title}</T>{subtitle && <T variant="small">{subtitle}</T>}</View>
    {right ?? <Feather name="chevron-right" size={18} color={colors.muted} />}
  </Pressable>;
}
export const s = StyleSheet.create({
  flex: { flex: 1 }, gap: { gap: 16 }, smallGap: { gap: 8 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  center: { alignItems: 'center', justifyContent: 'center' }, panel: { paddingVertical: 18, borderTopWidth: 1, borderBottomWidth: 1, gap: 12 }, badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 }, metric: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 3 },
  rowLink: { minHeight: 68, paddingVertical: 11, flexDirection: 'row', gap: 12, alignItems: 'center', borderBottomWidth: 1 }, iconWrap: { width: 32, height: 40, alignItems: 'center', justifyContent: 'center' }, sectionGap: { marginTop: 24 },
});
