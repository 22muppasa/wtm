import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Avatar, Button, Chip, Empty, Header, Photo, Screen, T } from '@/components/ui';
import { activities, currentUserId, users } from '@/data/seed';
import { useAppStore } from '@/stores/app';
import { useTheme } from '@/theme';
import type { TasteAxis, TasteVector } from '@/types';

const axes: Array<{ key: TasteAxis; title: string; low: string; high: string }> = [
  { key: 'effort', title: 'Effort', low: 'Easy', high: 'All in' },
  { key: 'novelty', title: 'Novelty', low: 'Familiar', high: 'New' },
  { key: 'obscurity', title: 'Obscurity', low: 'Classic', high: 'Niche' },
  { key: 'spontaneity', title: 'Spontaneity', low: 'Planned', high: 'Spur-of-the-moment' },
  { key: 'social', title: 'Social', low: 'Solo', high: 'Whole crew' },
  { key: 'rawness', title: 'Rawness', low: 'Polished', high: 'Unfiltered' },
];
const freshRatings = (): TasteVector => ({ effort: 3, novelty: 3, obscurity: 3, spontaneity: 3, social: 3, rawness: 3 });

export default function PhotoQueueScreen() {
  const { colors, radius } = useTheme();
  const moves = useAppStore(state => state.moves);
  const rateMove = useAppStore(state => state.rateMove);
  const updateMove = useAppStore(state => state.updateMove);
  const pending = useMemo(() => [...moves].filter(move => move.userId === currentUserId && move.photo && !move.ratings).sort((a, b) => b.date.localeCompare(a.date)), [moves]);
  const [activeId, setActiveId] = useState<string | undefined>(() => pending[0]?.id);
  const [ratings, setRatings] = useState<TasteVector>(freshRatings);
  const [stage, setStage] = useState<'rate' | 'friends'>('rate');
  const [people, setPeople] = useState<string[]>([]);
  const [publicPost, setPublicPost] = useState(false);
  const queueTotal = useRef(Math.max(pending.length, 1));
  const current = moves.find(move => move.id === activeId);
  const activity = activities.find(item => item.id === current?.activityId);
  const queuePosition = Math.max(1, queueTotal.current - pending.length + (pending.some(move => move.id === activeId) ? 1 : 0));

  const chooseRating = (axis: TasteAxis, value: number) => { setRatings(previous => ({ ...previous, [axis]: value })); void Haptics.selectionAsync(); };
  const continueToFriends = () => {
    if (!current) return;
    rateMove(current.id, ratings);
    setPeople(current.participantIds);
    setPublicPost(current.visibility === 'public');
    setStage('friends');
  };
  const saveAndNext = () => {
    if (!current) return;
    updateMove(current.id, { participantIds: people, visibility: publicPost ? 'public' : current.visibility });
    const next = pending.find(move => move.id !== current.id);
    if (next) {
      setActiveId(next.id);
      setRatings(freshRatings());
      setPeople([]);
      setPublicPost(false);
      setStage('rate');
    } else setActiveId(undefined);
  };

  if (!current || !activity) return <Screen><Header back /><Empty title="You’re all caught up." body="Every photo has a rating and a story. Your Tasteprint just got sharper." action="Back home" onAction={() => router.replace('/(tabs)/home')} /><Button title="See public profile" variant="secondary" onPress={() => router.replace('/(tabs)/you')} /></Screen>;

  return <Screen scroll={false} padded={false}>
    <View style={styles.header}><Header back /><View style={styles.headerCopy}><T variant="caption" color={colors.textSecondary}>{stage === 'rate' ? 'RATE THE MEMORY' : 'WHO WAS THERE?'}</T><T variant="label">{Math.min(queuePosition, queueTotal.current)} of {queueTotal.current}</T></View></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Photo image={current.photo ?? activity.image} style={[styles.hero, { borderRadius: radius.hero }]}><View style={styles.heroShade}><View><T variant="title" color="#fff">{activity.name}</T><T color="#fff">{current.placeName ?? 'A good place to be'}</T></View></View></Photo>
      {stage === 'rate' ? <>
        <View style={styles.titleBlock}><T variant="title">How did it feel?</T><T color={colors.textSecondary}>Go with your gut. These six taps teach WTM what to find next.</T></View>
        <View style={styles.axes}>{axes.map(axis => <View key={axis.key} style={[styles.axis, { backgroundColor: colors.surface, borderRadius: radius.lg }]}><View style={styles.axisHeader}><T variant="label">{axis.title}</T><T variant="caption" color={colors.accentPressed}>{ratings[axis.key]}/5</T></View><View style={styles.scale}>{[1, 2, 3, 4, 5].map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: ratings[axis.key] === value }} accessibilityLabel={`${axis.title} ${value} out of 5`} onPress={() => chooseRating(axis.key, value)} style={[styles.dot, { backgroundColor: value <= ratings[axis.key] ? colors.accent : colors.border, transform: [{ scale: ratings[axis.key] === value ? 1.24 : 1 }] }]} />)}</View><View style={styles.axisLabels}><T variant="caption" color={colors.muted}>{axis.low}</T><T variant="caption" color={colors.muted}>{axis.high}</T></View></View>)}</View>
      </> : <>
        <View style={styles.titleBlock}><T variant="title">Add the people in it.</T><T color={colors.textSecondary}>They’ll confirm before it reaches their history. You control whether this becomes a public post.</T></View>
        <View style={styles.people}>{users.filter(user => user.id !== currentUserId).map(user => { const selected = people.includes(user.id); return <Pressable key={user.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => setPeople(previous => selected ? previous.filter(id => id !== user.id) : [...previous, user.id])} style={[styles.person, { backgroundColor: selected ? colors.accentSoft : colors.surface, borderColor: selected ? colors.accent : colors.border, borderRadius: radius.lg }]}><Avatar userId={user.id} size={60} /><T variant="label">{user.displayName.split(' ')[0]}</T><Feather name={selected ? 'check-circle' : 'plus-circle'} size={20} color={selected ? colors.accent : colors.muted} /></Pressable>; })}</View>
        <View style={[styles.publish, { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg }]}><View style={styles.flex}><T variant="heading">Put it on your profile?</T><T variant="small" color={colors.textSecondary}>Public posts become your visual collection of favorite things to do.</T></View><Chip label={publicPost ? 'Public' : 'Keep private'} selected={publicPost} icon={publicPost ? 'globe' : 'lock'} onPress={() => setPublicPost(value => !value)} /></View>
      </>}
    </ScrollView>
    <View style={[styles.footer, { backgroundColor: colors.background }]}><Button title={stage === 'rate' ? 'Add friends' : pending.length > 1 ? 'Save & rate next' : 'Finish queue'} icon={stage === 'rate' ? 'users' : 'check'} onPress={stage === 'rate' ? continueToFriends : saveAndNext} />{stage === 'friends' ? <Button title="Back to ratings" variant="ghost" onPress={() => setStage('rate')} /> : null}</View>
  </Screen>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, header: { paddingHorizontal: 12 }, headerCopy: { position: 'absolute', left: 0, right: 0, top: 10, alignItems: 'center', pointerEvents: 'none' }, content: { paddingHorizontal: 24, paddingBottom: 24, gap: 24 }, hero: { height: 300 }, heroShade: { flex: 1, justifyContent: 'flex-end', padding: 20, backgroundColor: 'rgba(0,0,0,.2)' }, titleBlock: { gap: 8 }, axes: { gap: 9 }, axis: { padding: 15, gap: 10 }, axisHeader: { flexDirection: 'row', justifyContent: 'space-between' }, scale: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 5 }, dot: { width: 19, height: 19, borderRadius: 10 }, axisLabels: { flexDirection: 'row', justifyContent: 'space-between' }, people: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, person: { width: '48%', flexGrow: 1, padding: 16, borderWidth: 1, alignItems: 'center', gap: 9 }, publish: { padding: 18, gap: 16 }, footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16, gap: 3 },
});
