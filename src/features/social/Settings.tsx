import React, { useState } from 'react';
import { View, Switch, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Screen, Header, T, Section, Chip, Button, Sheet, Field, Avatar, Empty } from '@/components/ui';
import { useAppStore } from '@/stores/app';
import { useUIStore } from '@/stores/ui';
import { useTheme } from '@/theme';
import { notifications } from '@/data/seed';
import { Feather } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { s, Panel, RowLink, activityOf, dateLabel } from './shared';

export function SettingsScreen() {
  const state = useAppStore();
  const { colors } = useTheme();
  const toast = useUIStore(s => s.showToast);
  const [reset, setReset] = useState(false);
  const [campus, setCampus] = useState(state.campus);
  return <Screen><Header back title="Your settings" /><Section title="Make yourself at home" /><Panel><T variant="label">Appearance</T><View style={s.wrap}>{(['light', 'dark', 'system'] as const).map(theme => <Chip key={theme} label={theme.charAt(0).toUpperCase() + theme.slice(1)} selected={state.theme === theme} onPress={() => state.setTheme(theme)} />)}</View></Panel><Panel><T variant="label">Your campus</T><Field value={campus} onChangeText={setCampus} placeholder="Campus or community" maxLength={60} /><Button title="Save campus" variant="secondary" disabled={!campus.trim() || campus.trim() === state.campus} onPress={() => { state.setCampus(campus.trim()); toast('Campus updated.'); }} /></Panel>
    <Section title="A little privacy" /><Panel><T variant="label">New moves are visible to</T><View style={s.wrap}>{([{ key: 'private', label: 'Only me' }, { key: 'friends', label: 'Friends' }, { key: 'public', label: 'Public' }] as const).map(option => <Chip key={option.key} label={option.label} selected={state.defaultVisibility === option.key} onPress={() => state.setVisibility(option.key)} />)}</View><T variant="small">You can change this for each move. Location sharing is always a separate choice.</T></Panel><RowLink title="Want to Try" subtitle="The good ideas you saved" icon="bookmark" onPress={() => router.push('/list/want-to-try')} />
    <Section title="Developer · local demo" /><Panel><View style={s.row}><View style={s.flex}><T variant="label">Friday night feeling</T><T variant="small">Use the evening discovery context.</T></View><Switch accessibilityLabel="Friday night demo context" value={state.fridayMode} onValueChange={state.setFridayMode} trackColor={{ false: colors.border, true: colors.accent }} thumbColor={colors.white} /></View></Panel><T variant="small">Your moves, rankings, saves, and plans stay on this device. Crew replies are a clearly labeled demo.</T><Button title="Replay onboarding" variant="secondary" onPress={() => { state.replayOnboarding(); router.replace('/onboarding'); }} /><Button title="Reset demo" variant="ghost" onPress={() => setReset(true)} /><T variant="caption" style={{ textAlign: 'center' }}>WTM · Do. Rank. Discover. Go.</T>
    <Sheet visible={reset} onClose={() => setReset(false)} title="A fresh start?"><View style={s.gap}><T variant="body">This restores Shawn's original demo. Moves you added, ranking changes, saved ideas, and crew plans on this device will be replaced.</T><Button title="Reset to the original demo" onPress={() => { state.resetDemo(); setReset(false); toast('The original demo is ready.'); router.replace('/(tabs)/home'); }} /><Button title="Keep my moves" variant="secondary" onPress={() => setReset(false)} /></View></Sheet>
  </Screen>;
}
export function NotificationsScreen() {
  const { notificationReadIds, readNotification, proposals, crews } = useAppStore();
  const { colors } = useTheme();
  const planNotifications = proposals.filter(p => p.status !== 'draft').map(p => ({ id: `plan-${p.id}-${p.status}`, title: p.status === 'confirmed' ? 'The move is on.' : `${crews.find(c => c.id === p.crewId)?.name ?? 'Your crew'} has a plan`, body: `${activityOf(p.activityId)?.name ?? 'A new move'} · ${p.status === 'sent' ? 'Local demo proposal' : 'View your confirmed plan'}`, date: p.scheduledAt, route: `/proposal/${p.id}`, userId: undefined as string | undefined }));
  const items = [...planNotifications, ...notifications];
  return <Screen><Header back title="A few things for you" right={<Pressable onPress={() => items.forEach(item => readNotification(item.id))} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}><T variant="label" color={colors.accent}>Mark read</T></Pressable>} />{!items.length && <Empty title="All quiet here." body="We'll keep this space for things that matter." />}<View style={s.smallGap}>{items.map(item => <Pressable key={item.id} onPress={() => { readNotification(item.id); router.push(item.route as Href); }} accessibilityRole="button" accessibilityLabel={`${notificationReadIds.includes(item.id) ? '' : 'Unread. '}${item.title}. ${item.body}`} style={[s.row, { padding: 16, borderRadius: 20, backgroundColor: notificationReadIds.includes(item.id) ? colors.background : colors.surface, alignItems: 'flex-start' }]}>{item.userId ? <Avatar userId={item.userId} size={42} /> : <View style={[s.iconWrap, { backgroundColor: colors.accentSoft }]}><Feather name={item.id.startsWith('plan') ? 'calendar' : 'bell'} size={19} color={colors.accent} /></View>}<View style={[s.flex, s.smallGap]}><T variant="label">{item.title}</T><T variant="small">{item.body}</T><T variant="caption" color={colors.muted}>{dateLabel(item.date)}</T></View>{!notificationReadIds.includes(item.id) && <View style={{ height: 6, width: 6, borderRadius: 3, backgroundColor: colors.accent, marginTop: 8 }} />}</Pressable>)}</View></Screen>;
}
