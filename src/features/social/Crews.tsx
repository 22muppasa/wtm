import React, { useMemo, useState } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Screen, T, Header, IconButton, Button, Section, Photo, Avatar, AvatarStack, Sheet, Field, Empty, ActivityRow } from '@/components/ui';
import { TasteprintShape } from '@/components/TasteprintShape';
import { useTheme } from '@/theme';
import { useAppStore } from '@/stores/app';
import { useUIStore } from '@/stores/ui';
import { users, currentUserId } from '@/data/seed';
import { calculateOverlap, crewTaste } from '@/services/engine';
import type { Crew } from '@/types';
import { s, memberVectors, nameOf, activityOf, Badge, Panel, RowLink, dateLabel } from './shared';

function CrewCard({ crew, large }: { crew: Crew; large?: boolean }) {
  const moves = useAppStore(state => state.moves);
  const { colors } = useTheme();
  const overlap = calculateOverlap(memberVectors(crew, moves));
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${crew.name}, ${overlap}% taste overlap`} onPress={() => router.push(`/crew/${crew.id}`)}>
    <Photo image={crew.image} style={[styles.crewPhoto, { height: large ? 270 : 186 }]}>
      <LinearGradient colors={['transparent', colors.overlay]} style={styles.shade} />
      <View style={styles.cardCopy}><T variant={large ? 'title' : 'heading'} color={colors.white}>{crew.name}</T><T variant="small" color={colors.white}>{overlap}% taste overlap · {crew.sharedMoveIds.length} moves together</T><AvatarStack ids={crew.memberIds} size={30} /></View>
    </Photo>
  </Pressable>;
}
export function CrewsScreen() {
  const { colors } = useTheme();
  const { crews, createCrew } = useAppStore();
  const showToast = useUIStore(state => state.showToast);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const toggle = (id: string) => setMembers(previous => previous.includes(id) ? previous.filter(x => x !== id) : [...previous, id]);
  const save = () => {
    if (!name.trim() || !members.length) return;
    const id = createCrew(name.trim(), [currentUserId, ...members]);
    setCreating(false); setName(''); setMembers([]); showToast('Looks like a crew.'); router.push(`/crew/${id}`);
  };
  return <Screen><Header title="Your crews" right={<IconButton name="plus" label="Create a crew" onPress={() => setCreating(true)} />} /><T variant="body" style={{ marginBottom: 24 }}>Your people. A little more possibility.</T>
    {!crews.length ? <Empty title="Moves are better together." body="Start with the people you actually do things with." action="Create crew" onAction={() => setCreating(true)} /> : <View style={s.gap}>{crews.map((crew, index) => <CrewCard key={crew.id} crew={crew} large={index === 0} />)}</View>}
    <Sheet visible={creating} onClose={() => setCreating(false)} title="Looks like a crew."><View style={s.gap}><Field value={name} onChangeText={setName} placeholder="Give your crew a name" maxLength={40} /><T variant="label">Bring your people</T>{users.filter(user => user.id !== currentUserId).map(user => <Pressable key={user.id} onPress={() => toggle(user.id)} accessibilityRole="checkbox" accessibilityState={{ checked: members.includes(user.id) }} style={styles.member}><Avatar userId={user.id} size={42} /><View style={s.flex}><T variant="label">{user.displayName}</T><T variant="caption">@{user.username}</T></View><Feather name={members.includes(user.id) ? 'check-circle' : 'circle'} color={members.includes(user.id) ? colors.accent : colors.muted} size={22} /></Pressable>)}<Button title="Create crew" disabled={!name.trim() || !members.length} onPress={save} /></View></Sheet>
  </Screen>;
}
export function CrewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { crews, moves, proposals } = useAppStore();
  const { colors } = useTheme();
  const crew = crews.find(item => item.id === id);
  const vectors = useMemo(() => crew ? memberVectors(crew, moves) : [], [crew, moves]);
  if (!crew) return <Screen><Header back /><Empty title="This crew isn't here." body="Your crews are one tap away." action="View crews" onAction={() => router.replace('/(tabs)/crews')} /></Screen>;
  const overlap = calculateOverlap(vectors);
  const shared = moves.filter(move => crew.sharedMoveIds.includes(move.id) || crew.memberIds.filter(member => member !== currentUserId).every(member => move.confirmedParticipantIds.includes(member))).filter(move => move.userId === currentUserId);
  const top = [...shared].filter(m => m.rank !== undefined).sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999)).slice(0, 3);
  const spread = Object.keys(vectors[0] ?? {}) as (keyof typeof vectors[number])[];
  const sharedAxes = spread.sort((a, b) => vectors.reduce((n, v) => n + v[b], 0) - vectors.reduce((n, v) => n + v[a], 0)).slice(0, 3);
  const recentProposal = [...proposals].reverse().find(p => p.crewId === crew.id);
  return <Screen><Header back title="The group dynamic" /><Photo image={crew.image} style={styles.profileHero}><LinearGradient colors={['transparent', colors.overlay]} style={styles.shade} /><View style={styles.cardCopy}><AvatarStack ids={crew.memberIds} size={34} /><T variant="title" color={colors.white}>{crew.name}</T><T variant="small" color={colors.white}>{crew.memberIds.map(nameOf).join(' · ')}</T></View></Photo>
    <View style={[s.center, { marginVertical: 24 }]}><TasteprintShape vector={crewTaste(vectors)} size={238} /><T variant="title">{overlap}%</T><T variant="small">taste overlap</T></View>
    <View style={[s.wrap, { justifyContent: 'center', marginBottom: 24 }]}>{sharedAxes.map(axis => <Badge key={axis} kind="neutral">{axis === 'social' ? 'Together' : axis.charAt(0).toUpperCase() + axis.slice(1)}</Badge>)}</View>
    <Button title="Find our next move" icon="arrow-up-right" onPress={() => router.push(`/crew/${crew.id}/recommend`)} />
    {recentProposal && <View style={s.sectionGap}><RowLink title={recentProposal.status === 'confirmed' ? 'The move is on.' : 'Your latest plan'} subtitle={activityOf(recentProposal.activityId)?.name} icon="calendar" onPress={() => router.push(`/proposal/${recentProposal.id}`)} /></View>}
    <Section title="Our top moves" action="History" onAction={() => router.push(`/crew/${crew.id}/history`)} />
    {top.length ? <View style={s.smallGap}>{top.map((move, index) => { const activity = activityOf(move.activityId); return activity ? <ActivityRow key={move.id} activity={activity} rank={index + 1} subtitle="Loved together" onPress={() => router.push(`/move/${move.id}`)} /> : null; })}</View> : <Panel><T variant="body">Your next shared experience starts the story.</T><Button title="Log a move together" variant="ghost" onPress={() => router.push('/log')} /></Panel>}
    <Section title="The people" /><View style={s.smallGap}>{crew.memberIds.map(member => <RowLink key={member} title={users.find(u => u.id === member)?.displayName ?? member} subtitle={member === currentUserId ? 'You' : 'View taste & top moves'} onPress={() => router.push(`/profile/${users.find(u => u.id === member)?.username ?? member}`)} right={<Avatar userId={member} size={36} />} />)}</View>
  </Screen>;
}
export function CrewHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { crews, moves } = useAppStore();
  const crew = crews.find(c => c.id === id);
  const shared = crew ? moves.filter(m => crew.sharedMoveIds.includes(m.id)).sort((a, b) => b.date.localeCompare(a.date)) : [];
  return <Screen><Header back title="Moves together" subtitle={crew?.name} />{shared.length ? <View style={s.smallGap}>{shared.map(move => { const activity = activityOf(move.activityId); return activity ? <ActivityRow key={move.id} activity={activity} subtitle={`${dateLabel(move.date)} · ${move.placeName ?? 'No place needed'}`} onPress={() => router.push(`/move/${move.id}`)} /> : null; })}</View> : <Empty title="A good place to start." body="Shared moves will live here after you log them." action="Log a move" onAction={() => router.push('/log')} />}</Screen>;
}
const styles = StyleSheet.create({ crewPhoto: { width: '100%', borderRadius: 24, overflow: 'hidden' }, profileHero: { height: 232, borderRadius: 24, overflow: 'hidden' }, shade: { ...StyleSheet.absoluteFill }, cardCopy: { position: 'absolute', left: 20, right: 20, bottom: 20, gap: 8 }, member: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 } });
