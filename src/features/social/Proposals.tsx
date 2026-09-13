import React, { useEffect, useRef, useState } from 'react';
import { View, Share, Linking, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Screen, Header, T, Button, Photo, Avatar, AvatarStack, Sheet, Field, Empty, Section } from '@/components/ui';
import { useAppStore } from '@/stores/app';
import { useUIStore } from '@/stores/ui';
import { useTheme } from '@/theme';
import { currentUserId } from '@/data/seed';
import { s, nameOf, activityOf, scheduleLabel, Badge, Panel } from './shared';

export function ProposalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useAppStore();
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const toast = useUIStore(s => s.showToast);
  const proposal = state.proposals.find(p => p.id === id);
  const activity = proposal ? activityOf(proposal.activityId) : undefined;
  const crew = state.crews.find(c => c.id === proposal?.crewId);
  const [changingTime, setChangingTime] = useState(false);
  const [localTime, setLocalTime] = useState('');
  const [timeError, setTimeError] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  if (!proposal || !activity || !crew) return <Screen><Header back /><Empty title="This plan isn't here." body="Find something worth getting together for." action="Your crews" onAction={() => router.replace('/(tabs)/crews')} /></Screen>;
  const yes = crew.memberIds.filter(member => proposal.responses[member] === 'yes').length;
  const pending = crew.memberIds.filter(member => !proposal.responses[member] || proposal.responses[member] === 'pending').length;
  const canConfirm = yes >= Math.min(crew.memberIds.length, Math.max(2, Math.ceil(crew.memberIds.length / 2))) && proposal.responses[currentUserId] === 'yes';
  const share = async () => {
    try { await Share.share({ title: `The move: ${activity.name}`, message: `${activity.name} with ${crew.name}\n${scheduleLabel(proposal.scheduledAt)}\n${activity.placeName ?? ''}\n${proposal.fit}% Crew Fit\nWho's in?` }); }
    catch { toast('Sharing is unavailable here. Your plan is saved.'); }
  };
  const simulate = () => {
    if (simulating) return;
    setSimulating(true);
    const respondents = crew.memberIds.filter(member => member !== currentUserId).slice(0, 2);
    respondents.forEach((member, i) => { timers.current.push(setTimeout(() => { state.respondProposal(proposal.id, member, 'yes'); void Haptics.selectionAsync(); }, (i + 1) * 550)); });
    timers.current.push(setTimeout(() => { setSimulating(false); toast('Demo replies added. No messages were sent.'); }, (respondents.length + 1) * 550));
  };
  const openTime = () => {
    const date = new Date(proposal.scheduledAt);
    const pad = (n: number) => String(n).padStart(2, '0');
    setLocalTime(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`);
    setTimeError(false); setChangingTime(true);
  };
  const saveTime = () => {
    const date = new Date(localTime);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) { setTimeError(true); return; }
    state.updateProposal(proposal.id, { scheduledAt: date.toISOString() }); setChangingTime(false); toast('Time updated.');
  };
  const open = async (url: string) => { try { await Linking.openURL(url); } catch { toast('This link could not open. Try again from your device.'); } };
  const calendar = () => {
    const start = new Date(proposal.scheduledAt);
    const end = new Date(start.getTime() + activity.minutes * 60_000);
    const format = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    void open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(activity.name)}&dates=${format(start)}/${format(end)}&location=${encodeURIComponent(activity.placeName ?? '')}&details=${encodeURIComponent(`With ${crew.name}. ${proposal.fit}% Crew Fit on WTM.`)}`);
  };
  return <Screen><Header back title={proposal.status === 'confirmed' ? 'Good plans, good people' : crew.name} />
    {proposal.status === 'confirmed' && <Animated.View entering={FadeIn.duration(reduced ? 0 : 240)} style={[s.center, { marginTop: 16, marginBottom: 24 }]}><View style={[styles.success, { backgroundColor: colors.successSoft }]}><Feather name="check" color={colors.success} size={30} /></View><T variant="display" style={{ marginTop: 16 }}>The move is on.</T><T variant="body" style={{ marginTop: 8 }}>{yes} in{pending ? ` · ${pending} still deciding` : ' · everyone is in'}</T></Animated.View>}
    {proposal.status === 'sent' && <View style={{ marginTop: 12, marginBottom: 24 }}><T variant="display">The move is out.</T><T variant="body" style={{ marginTop: 8 }}>A plan worth getting off the phone for.</T></View>}
    {proposal.status === 'draft' && <View style={{ marginTop: 12, marginBottom: 24 }}><T variant="display">Make it happen.</T><T variant="body" style={{ marginTop: 8 }}>One good idea. Your favorite people.</T></View>}
    <Photo image={activity.image} style={styles.hero} /><View style={[s.gap, { marginTop: 20 }]}><View style={s.between}><T variant="title" style={s.flex}>{activity.name}</T><Badge>{proposal.fit}% fit</Badge></View><T variant="body">{activity.placeName ?? 'Wherever you make it'}</T><Panel><View style={s.row}><Feather name="calendar" size={20} color={colors.accent} /><View style={s.flex}><T variant="label">{scheduleLabel(proposal.scheduledAt)}</T><T variant="small">{activity.minutes} minutes · {activity.price ? '$'.repeat(activity.price) : 'Free'}</T></View>{proposal.status === 'draft' && <Pressable accessibilityRole="button" accessibilityLabel="Change plan time" onPress={openTime} style={styles.change}><T variant="label" color={colors.accent}>Edit</T></Pressable>}</View></Panel></View>
    {proposal.status === 'draft' ? <View style={[s.gap, { marginTop: 24 }]}><AvatarStack ids={crew.memberIds} size={40} /><T variant="small">{crew.memberIds.map(nameOf).join(' · ')}</T><Button title="Send to crew" icon="arrow-up-right" onPress={() => { state.sendProposal(proposal.id); void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }} /><T variant="caption">Local demo · saves the proposal for your crew here. Use Share to invite your real group.</T><Button title="Change time" variant="ghost" onPress={openTime} /></View> : proposal.status === 'sent' ? <>
      <Section title="Who's in?" /><View style={s.smallGap}>{crew.memberIds.map(member => { const response = proposal.responses[member] ?? 'pending'; return <View key={member} style={[styles.response, { backgroundColor: colors.surface }]}><Avatar userId={member} size={40} /><T variant="label" style={s.flex}>{nameOf(member)}{member === currentUserId ? ' (you)' : ''}</T><T variant="small" color={response === 'yes' ? colors.success : colors.textSecondary}>{response === 'yes' ? 'Yes' : response === 'no' ? 'Can’t make it' : response === 'maybe' ? 'Maybe' : 'Pending'}</T><Feather name={response === 'yes' ? 'check-circle' : response === 'no' ? 'x-circle' : 'clock'} size={18} color={response === 'yes' ? colors.success : colors.muted} /></View>; })}</View>
      <T variant="label" style={{ marginTop: 24, marginBottom: 12 }}>Your response</T><View style={s.row}>{(['yes', 'maybe', 'no'] as const).map(response => <Button key={response} title={response === 'yes' ? 'Yes' : response === 'maybe' ? 'Maybe' : 'No'} variant={proposal.responses[currentUserId] === response ? 'primary' : 'secondary'} onPress={() => { state.respondProposal(proposal.id, currentUserId, response); void Haptics.selectionAsync(); }} style={s.flex} />)}</View>
      <View style={[s.gap, { marginTop: 24 }]}><Button title={canConfirm ? `Confirm the move · ${yes} in` : 'Waiting for your people'} disabled={!canConfirm} onPress={() => { state.confirmProposal(proposal.id); void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }} /><Button title="Share to group chat" icon="share" variant="secondary" onPress={() => void share()} /><Panel><T variant="label">Try the crew flow</T><T variant="small">Preview sample replies in this local demo. Your friends won't receive anything.</T><Button title={simulating ? 'Replies coming in…' : 'Preview demo replies'} variant="ghost" disabled={simulating} onPress={simulate} /></Panel></View>
    </> : <View style={[s.gap, { marginTop: 24 }]}><AvatarStack ids={crew.memberIds.filter(member => proposal.responses[member] === 'yes')} size={42} /><Button title="Directions" icon="navigation" onPress={() => void open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${activity.placeName ?? activity.name} Urbana Champaign Illinois`)}`)} /><View style={s.row}><Button title="Add to calendar" icon="calendar" variant="secondary" onPress={calendar} style={s.flex} /><Button title="Share" icon="share" variant="secondary" onPress={() => void share()} /></View><T variant="caption">Calendar opens a draft for you to review and save.</T><Button title="View activity details" variant="ghost" onPress={() => router.push(`/activity/${activity.id}`)} /><Button title="We did it · log the move" variant="secondary" onPress={() => router.push({ pathname: '/log', params: { activityId: activity.id, crewId: crew.id } })} /></View>}
    <Sheet visible={changingTime} onClose={() => setChangingTime(false)} title="Make a little time"><View style={s.gap}><Field value={localTime} onChangeText={text => { setLocalTime(text); setTimeError(false); }} placeholder="YYYY-MM-DD HH:MM" accessibilityLabel="Plan date and local time" /><T variant="small" color={timeError ? colors.accent : colors.textSecondary}>{timeError ? 'Choose a valid date and time in the future.' : 'Local time · YYYY-MM-DD HH:MM'}</T><Button title="Save time" onPress={saveTime} /></View></Sheet>
  </Screen>;
}
const styles = StyleSheet.create({ hero: { width: '100%', height: 222, borderRadius: 24, overflow: 'hidden' }, success: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }, response: { minHeight: 64, borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }, change: { minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' } });
