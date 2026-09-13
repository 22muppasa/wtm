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
  { key: 'spontaneity', title: 'Spontaneity', low: 'Planned', high: 'Unplanned' },
  { key: 'social', title: 'Social', low: 'Solo', high: 'Whole crew' },
  { key: 'rawness', title: 'Rawness', low: 'Polished', high: 'Unfiltered' },
];
const freshRatings = (): TasteVector => ({ effort: 3, novelty: 3, obscurity: 3, spontaneity: 3, social: 3, rawness: 3 });

export default function PhotoQueueScreen() {
  const { colors } = useTheme();
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
  const nextUp = pending.filter(move => move.id !== activeId).slice(0, 2);
  const queuePosition = Math.max(1, queueTotal.current - pending.length + (pending.some(move => move.id === activeId) ? 1 : 0));

  const chooseRating = (axis: TasteAxis, value: number) => {
    setRatings(previous => ({ ...previous, [axis]: value }));
    void Haptics.selectionAsync();
  };
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
    <View style={styles.header}><Header back /><View pointerEvents="none" style={styles.headerCopy}><T variant="caption" color={colors.textSecondary} style={styles.eyebrow}>{stage === 'rate' ? 'RATE THE MEMORY' : 'TAG THE PEOPLE'}</T><T variant="label">{Math.min(queuePosition, queueTotal.current)} / {queueTotal.current}</T></View></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Photo image={current.photo ?? activity.image} style={styles.hero}><View style={styles.heroShade}><View style={styles.heroMeta}><T variant="display" color="#fff">{activity.name}</T><T color="#fff">{current.placeName ?? 'A good place to be'}</T></View></View></Photo>
      <View style={styles.body}>
        {stage === 'rate' ? <>
          <View style={styles.titleBlock}><T variant="title">How did it feel?</T><T color={colors.textSecondary}>Go with your gut. Six quick signals teach WTM what to find next.</T></View>
          <View>{axes.map(axis => <View key={axis.key} style={[styles.axis, { borderColor: colors.border }]}>
            <View style={styles.axisHeader}><View><T variant="label">{axis.title}</T><T variant="caption" color={colors.textSecondary}>{axis.low} → {axis.high}</T></View><T variant="label" color={colors.accentPressed}>{ratings[axis.key]}/5</T></View>
            <View style={styles.scale}>{[1, 2, 3, 4, 5].map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: ratings[axis.key] === value }} accessibilityLabel={`${axis.title} ${value} out of 5`} onPress={() => chooseRating(axis.key, value)} style={styles.dotTap}><View style={[styles.dot, { backgroundColor: value <= ratings[axis.key] ? colors.accent : colors.border, transform: [{ scale: ratings[axis.key] === value ? 1.28 : 1 }] }]} /></Pressable>)}</View>
          </View>)}</View>
          {nextUp.length ? <View style={styles.nextSection}><View style={styles.nextHeader}><T variant="heading">Next in the queue</T><T variant="caption" color={colors.textSecondary}>{nextUp.length} waiting</T></View>{nextUp.map(move => { const item = activities.find(candidate => candidate.id === move.activityId); return item ? <View key={move.id} style={[styles.nextRow, { borderColor: colors.border }]}><Photo image={move.photo ?? item.image} style={styles.nextPhoto} /><View style={styles.flex}><T variant="label">{item.name}</T><T variant="caption" color={colors.textSecondary}>{move.placeName ?? item.placeName}</T></View><T variant="caption" color={colors.textSecondary}>QUEUED</T></View> : null; })}</View> : null}
        </> : <>
          <View style={styles.titleBlock}><T variant="title">Who was there?</T><T color={colors.textSecondary}>They confirm before it reaches their history. You still choose whether this becomes public.</T></View>
          <View>{users.filter(user => user.id !== currentUserId).map(user => { const selected = people.includes(user.id); return <Pressable key={user.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={user.displayName} onPress={() => setPeople(previous => selected ? previous.filter(id => id !== user.id) : [...previous, user.id])} style={[styles.person, { borderColor: colors.border }]}><Avatar userId={user.id} size={48} /><View style={styles.flex}><T variant="label">{user.displayName}</T><T variant="caption" color={colors.textSecondary}>@{user.username}</T></View><View style={[styles.personCheck, { backgroundColor: selected ? colors.accent : colors.surfaceAlt }]}><Feather name={selected ? 'check' : 'plus'} size={16} color={selected ? colors.white : colors.textSecondary} /></View></Pressable>; })}</View>
          <View style={[styles.publish, { backgroundColor: colors.ink }]}><View style={styles.flex}><T variant="caption" color={colors.lime} style={styles.eyebrow}>PUBLIC FLEX</T><T variant="heading" color={colors.white}>Put it on your profile?</T><T variant="small" color={colors.white}>Build an Instagram-like record of the niche things you actually do.</T></View><Chip label={publicPost ? 'Public' : 'Private'} selected={publicPost} icon={publicPost ? 'globe' : 'lock'} onPress={() => setPublicPost(value => !value)} /></View>
        </>}
      </View>
    </ScrollView>
    <View style={[styles.footer, { backgroundColor: colors.background, borderColor: colors.border }]}><Button title={stage === 'rate' ? 'Add friends' : pending.length > 1 ? 'Save & rate next' : 'Finish queue'} icon={stage === 'rate' ? 'users' : 'check'} onPress={stage === 'rate' ? continueToFriends : saveAndNext} />{stage === 'friends' ? <Button title="Back to ratings" variant="ghost" onPress={() => setStage('rate')} /> : null}</View>
  </Screen>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, eyebrow: { fontWeight: '800', letterSpacing: .8 }, header: { paddingHorizontal: 10 }, headerCopy: { position: 'absolute', left: 0, right: 0, top: 8, alignItems: 'center' }, content: { paddingBottom: 28 }, hero: { width: '100%', height: 292, borderRadius: 0 }, heroShade: { flex: 1, justifyContent: 'flex-end', padding: 20, backgroundColor: 'rgba(0,0,0,.22)' }, heroMeta: { gap: 3 }, body: { paddingHorizontal: 20, paddingTop: 24, gap: 28 }, titleBlock: { gap: 7 },
  axis: { paddingVertical: 14, borderBottomWidth: 1, gap: 8 }, axisHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, scale: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: -8 }, dotTap: { width: 44, height: 34, alignItems: 'center', justifyContent: 'center' }, dot: { width: 16, height: 16, borderRadius: 8 },
  nextSection: { gap: 6 }, nextHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }, nextRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, paddingVertical: 9 }, nextPhoto: { width: 52, height: 52, borderRadius: 8 },
  person: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, paddingVertical: 10 }, personCheck: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, publish: { padding: 18, borderRadius: 12, gap: 16 }, footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14, borderTopWidth: 1, gap: 2 },
});
