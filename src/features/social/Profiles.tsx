import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ActivityRow, Avatar, Button, Chip, Empty, Header, IconButton, Photo, Screen, Section, Sheet, T } from '@/components/ui';
import { TasteprintShape } from '@/components/TasteprintShape';
import { useTheme } from '@/theme';
import { useAppStore } from '@/stores/app';
import { useUIStore } from '@/stores/ui';
import { activities, categoryLabels, currentUserId, friendMoves, publicLists, users } from '@/data/seed';
import { calculateOverlap, calculateRange, recommend } from '@/services/engine';
import type { ActivityCategory, Move, User } from '@/types';
import { activityOf, axes, Badge, dateLabel, Metric, mine, nameOf, Panel, personalTaste, RowLink, s } from './shared';
import { TraitBars } from './Taste';

type ProfileTab = 'Highlights' | 'Rankings' | 'Lists' | 'Taste';
const tabs: Array<{ key: ProfileTab; label: string }> = [
  { key: 'Highlights', label: 'Flexes' },
  { key: 'Rankings', label: 'Ranked' },
  { key: 'Lists', label: 'Lists' },
  { key: 'Taste', label: 'Tasteprint' },
];

export function OwnProfileScreen() {
  return <ProfileContent user={users.find(user => user.id === currentUserId)!} own />;
}

export function FriendProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const user = users.find(candidate => candidate.username === username || candidate.id === username);
  if (!user) return <Screen><Header back /><Empty title="This person isn't here yet." body="Start with the people in your crews." action="Your crews" onAction={() => router.replace('/(tabs)/crews')} /></Screen>;
  return <ProfileContent user={user} own={user.id === currentUserId} back />;
}

function ProfileContent({ user, own, back = false }: { user: User; own: boolean; back?: boolean }) {
  const params = useLocalSearchParams<{ tab?: string }>();
  const state = useAppStore();
  const { colors } = useTheme();
  const toast = useUIStore(store => store.showToast);
  const [tab, setTab] = useState<ProfileTab>(params.tab === 'rankings' ? 'Rankings' : params.tab === 'lists' ? 'Lists' : 'Highlights');
  const [category, setCategory] = useState<ActivityCategory>('active');
  const [comparison, setComparison] = useState(false);
  const [editingPublic, setEditingPublic] = useState(false);
  const myTaste = personalTaste(state.moves);
  const taste = own ? myTaste : user.taste;
  const moves = own ? mine(state.moves) : friendMoves.filter(move => move.userId === user.id && move.visibility !== 'private');
  const ranked = [...moves].filter(move => move.rank !== undefined).sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  const categoryRanked = ranked.filter(move => move.category === category);
  const lists = publicLists.filter(list => list.userId === user.id);
  const top = ranked.slice(0, 3);
  const publicMoves = [...moves].filter(move => move.visibility === 'public').sort((a, b) => b.date.localeCompare(a.date));
  const profileGrid = own && editingPublic ? [...moves].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12) : publicMoves.slice(0, 12);
  const ratingValues = moves.flatMap(move => move.ratings ? Object.values(move.ratings) : []);
  const averageRating = ratingValues.length ? (ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length).toFixed(1) : ranked.length ? '4.4' : '—';
  const followerCount: Record<string, string> = { shawn: '1.2k', maya: '2.8k', alex: '864', ryan: '1.7k', noah: '706' };
  const followingCount: Record<string, string> = { shawn: '482', maya: '711', alex: '324', ryan: '590', noah: '281' };
  const range = calculateRange(moves, activities);
  const overlap = calculateOverlap([myTaste, taste]);
  const differences = [...axes].sort((a, b) => Math.abs(taste[a.key] - myTaste[a.key]) - Math.abs(taste[b.key] - myTaste[b.key]));
  const together = useMemo(() => own ? [] : recommend({ id: `pair-${user.id}`, name: 'You two', memberIds: [currentUserId, user.id], image: 'friends', sharedMoveIds: [] }, users.map(person => person.id === currentUserId ? { ...person, taste: myTaste } : person), activities, state.moves, { when: 'Anytime', energy: 'any', budget: 3, radius: 500 }).slice(0, 3), [own, user.id, myTaste, state.moves]);
  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const ids = categoryRanked.map(move => move.id);
    const [id] = ids.splice(from, 1);
    ids.splice(to, 0, id);
    state.reorderCategory(category, ids);
    toast('Rankings updated. Your taste moved with them.');
  };

  return <Screen>
    <Header back={back} right={own ? <View style={s.row}><IconButton name="share" label="Share profile" onPress={() => { void Share.share({ message: `See @${user.username}'s public Moves on WTM.` }); }} /><IconButton name="settings" label="Open settings" onPress={() => router.push('/settings')} /></View> : undefined} />

    <View style={styles.profileHero}>
      <View style={styles.identityRow}>
        <View style={[styles.avatarRing, { borderColor: colors.accent }]}><Avatar userId={user.id} size={78} /></View>
        <View style={styles.stats}><Metric value={followerCount[user.id] ?? '—'} label="Followers" /><Metric value={followingCount[user.id] ?? '—'} label="Following" /><Metric value={moves.length} label="Moves" /><Metric value={`${range}°`} label="Range" /></View>
      </View>
      <View style={styles.nameBlock}>
        <View style={styles.nameLine}><T variant="heading">{user.displayName}</T><View style={[styles.badgeSmall, { backgroundColor: colors.surfaceAlt }]}><T variant="caption" style={styles.eyebrow}>{own ? state.campus : user.campus} · EXPLORER</T></View></View>
        <T variant="small" color={colors.textSecondary}>@{user.username}</T>
        <T color={colors.textSecondary}>{own ? 'High-energy hangs, obscure late-night eats, and the places worth crossing town for.' : 'A public cut of the moves, places, and nights worth doing again.'}</T>
        <T variant="caption" color={colors.accentPressed} style={styles.strong}>AVG RATING {averageRating} / 5</T>
      </View>
      {own ? <View style={styles.profileActions}><Button title={editingPublic ? 'Done editing' : 'Edit Taste Flex'} icon="sliders" variant="secondary" onPress={() => { setTab('Highlights'); setEditingPublic(value => !value); }} style={styles.flex} /><Button title={state.travelCity ? `${state.travelCity} ON` : 'Travel mode'} icon="navigation" onPress={() => router.push('/(tabs)/home')} style={styles.flex} /></View> : <Button title={state.followingIds.includes(user.id) ? 'Following' : `Follow ${user.displayName.split(' ')[0]}`} variant={state.followingIds.includes(user.id) ? 'secondary' : 'primary'} onPress={() => state.toggleFollow(user.id)} />}
    </View>

    {own && state.travelCity ? <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/explore')} style={[styles.travelBand, { backgroundColor: colors.ink }]}><View style={[styles.travelMark, { backgroundColor: colors.lime }]}><Feather name="navigation" size={20} color={colors.ink} /></View><View style={styles.flex}><T variant="caption" color={colors.lime} style={styles.eyebrow}>TRAVELER TASTE ACTIVE</T><T variant="label" color={colors.white}>{state.travelCity} is filtered through your Tasteprint.</T></View><Feather name="arrow-right" size={19} color={colors.white} /></Pressable> : null}

    {!own ? <Pressable onPress={() => setComparison(true)} accessibilityRole="button" accessibilityLabel={`Compare tastes, ${overlap}% overlap`} style={[styles.overlap, { borderColor: colors.border }]}><TasteprintShape vector={taste} overlay={myTaste} size={112} /><View style={styles.flex}><T variant="title">{overlap}%</T><T variant="small">taste overlap</T><T variant="label" color={colors.accentPressed} style={styles.link}>Find your common ground →</T></View></Pressable> : null}

    <View style={[styles.tabs, { borderBottomColor: colors.border }]}>{tabs.map(item => <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === item.key }} key={item.key} onPress={() => setTab(item.key)} style={[styles.tab, { borderBottomColor: tab === item.key ? colors.accent : 'transparent' }]}><T variant="small" color={tab === item.key ? colors.text : colors.textSecondary} style={{ fontWeight: tab === item.key ? '700' : '500' }}>{item.label}</T></Pressable>)}</View>

    {tab === 'Highlights' ? <>
      <Section title={own ? 'Public Flexes' : `${user.displayName.split(' ')[0]}'s Flexes`} action={own ? editingPublic ? 'Done' : 'Edit' : undefined} onAction={own ? () => setEditingPublic(value => !value) : undefined} />
      {profileGrid.length ? <View style={styles.publicGrid}>{profileGrid.map(move => {
        const activity = activityOf(move.activityId);
        if (!activity) return null;
        const isPublic = move.visibility === 'public';
        return <Pressable key={move.id} accessibilityRole="button" accessibilityLabel={editingPublic ? `${isPublic ? 'Remove' : 'Add'} ${activity.name} ${isPublic ? 'from' : 'to'} public profile` : `View ${activity.name}`} onPress={() => editingPublic && own ? (state.updateMove(move.id, { visibility: isPublic ? 'friends' : 'public' }), toast(isPublic ? 'Removed from your public profile' : 'Added to your public profile')) : router.push(`/move/${move.id}`)} style={styles.publicTile}>
          <Photo image={move.photo ?? activity.image} style={styles.publicImage}><View style={styles.publicOverlay}><T variant="label" color={colors.white} numberOfLines={2}>{activity.name}</T><T variant="caption" color={colors.white}>{categoryLabels[move.category]}</T></View></Photo>
          <View style={[styles.visibility, { backgroundColor: isPublic ? colors.accent : 'rgba(16,15,14,.72)' }]}><Feather name={isPublic ? 'globe' : 'lock'} size={13} color="#fff" /></View>
        </Pressable>;
      })}</View> : <Empty title="Your flex starts here." body="Choose the activities and memories you want people to see." action={own ? 'Edit public profile' : undefined} onAction={() => setEditingPublic(true)} />}
      {own && editingPublic ? <T variant="caption" color={colors.textSecondary}>Tap any memory to add or remove it. Private places still hide their exact location.</T> : null}
      <Section title="Past ratings" />
      {top[0] && activityOf(top[0].activityId) ? <ActivityRow activity={activityOf(top[0].activityId)!} rank={1} subtitle={`Your #1 in ${categoryLabels[top[0].category]}`} onPress={() => router.push(`/move/${top[0].id}`)} /> : null}
      <View>{top.slice(1).map(move => { const activity = activityOf(move.activityId); return activity ? <ActivityRow key={move.id} activity={activity} rank={move.rank} subtitle={`${categoryLabels[move.category]} · rated to do again`} onPress={() => router.push(`/move/${move.id}`)} /> : null; })}</View>
      {own ? <RowLink title="Want to try" subtitle={`${state.savedIds.length} good ideas for later`} icon="bookmark" onPress={() => router.push('/list/want-to-try')} /> : null}
      <Section title="Lately" />
      <View>{[...moves].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map(move => { const activity = activityOf(move.activityId); return activity ? <ActivityRow key={move.id} activity={activity} subtitle={dateLabel(move.date)} onPress={() => router.push(`/move/${move.id}`)} /> : null; })}</View>
      {own ? <RowLink title="Your season, so far" subtitle="A few things worth remembering" icon="sun" onPress={() => router.push('/recap')} /> : null}
    </> : null}

    {tab === 'Rankings' ? <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.wrap}>{(Object.keys(categoryLabels) as ActivityCategory[]).filter(key => ranked.some(move => move.category === key) || key === category).map(key => <Chip key={key} label={categoryLabels[key]} selected={category === key} onPress={() => setCategory(key)} />)}</ScrollView>
      <View style={s.between}><T variant="heading">{categoryLabels[category]}</T><T variant="small">{categoryRanked.length} ranked</T></View>
      {own && categoryRanked.length > 1 ? <T variant="caption">Drag a handle to reorder. Your Tasteprint updates with it.</T> : null}
      <View>{categoryRanked.map((move, index) => own ? <RankedRow key={move.id} move={move} index={index} count={categoryRanked.length} onReorder={reorder} /> : <ActivityRow key={move.id} activity={activityOf(move.activityId)!} rank={move.rank} onPress={() => router.push(`/move/${move.id}`)} />)}</View>
      {!categoryRanked.length ? <Empty title="Nothing ranked here yet." body="Log something you did. Your favorites will find their place." action={own ? 'Log a move' : undefined} onAction={() => router.push('/log')} /> : null}
      {own ? <Button title="Log another move" variant="secondary" onPress={() => router.push('/log')} /> : null}
    </> : null}

    {tab === 'Lists' ? <>
      {own ? <RowLink title="Want to try" subtitle={`${state.savedIds.length} saved moves`} icon="bookmark" onPress={() => router.push('/list/want-to-try')} /> : null}
      <View>{lists.map(list => <RowLink key={list.id} title={list.title} subtitle={list.subtitle} icon="list" onPress={() => router.push(`/list/${list.id}`)} />)}{own ? state.savedListIds.map(id => publicLists.find(list => list.id === id)).filter(list => !!list).map(list => <RowLink key={list.id} title={list.title} subtitle="Saved list" icon="bookmark" onPress={() => router.push(`/list/${list.id}`)} />) : null}</View>
      {!lists.length && (!own || !state.savedListIds.length) ? <T>Your saved and shared lists will live here.</T> : null}
    </> : null}

    {tab === 'Taste' ? <><View style={s.center}><TasteprintShape vector={taste} size={270} labels /></View><TraitBars vector={taste} interactive={own} /><Button title={own ? 'Explore your Tasteprint' : 'Compare our tastes'} variant="secondary" onPress={() => own ? router.push('/taste') : setComparison(true)} /></> : null}

    <Sheet visible={comparison} onClose={() => setComparison(false)} title="Your common ground"><View style={s.gap}><View style={[s.row, styles.comparePeople]}><Avatar userId={currentUserId} size={44} /><Badge>{overlap}% overlap</Badge><Avatar userId={user.id} size={44} /></View><View style={s.center}><TasteprintShape vector={myTaste} overlay={taste} size={244} labels /></View><Panel><T variant="heading">Same wavelength</T><T>{differences.slice(0, 2).map(axis => axis.title).join(' · ')}</T><T variant="small">Your preferences land closest here.</T></Panel><Panel><T variant="heading">Where you split</T><T>{differences[5].title}</T><T variant="small">{myTaste[differences[5].key] > taste[differences[5].key] ? 'You lean more toward ' : `${nameOf(user.id)} leans more toward `}{differences[5].high.toLowerCase()}.</T></Panel><T variant="heading">You'd probably both love</T>{together.map(result => <ActivityRow key={result.activity.id} activity={result.activity} subtitle={`${result.score}% fit for you two`} onPress={() => { setComparison(false); router.push(`/activity/${result.activity.id}`); }} />)}</View></Sheet>
  </Screen>;
}

function RankedRow({ move, index, count, onReorder }: { move: Move; index: number; count: number; onReorder: (from: number, to: number) => void }) {
  const { colors } = useTheme();
  const y = useRef(new Animated.Value(0)).current;
  const [dragging, setDragging] = useState(false);
  const pan = useMemo(() => PanResponder.create({ onStartShouldSetPanResponder: () => count > 1, onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5, onPanResponderGrant: () => setDragging(true), onPanResponderMove: (_, gesture) => y.setValue(gesture.dy), onPanResponderRelease: (_, gesture) => { const next = Math.max(0, Math.min(count - 1, index + Math.round(gesture.dy / 80))); y.setValue(0); setDragging(false); onReorder(index, next); }, onPanResponderTerminate: () => { y.setValue(0); setDragging(false); } }), [count, index, onReorder, y]);
  const activity = activityOf(move.activityId);
  if (!activity) return null;
  return <Animated.View style={{ transform: [{ translateY: y }], zIndex: dragging ? 10 : 0, opacity: dragging ? .88 : 1 }}><View style={[styles.rankRow, { backgroundColor: dragging ? colors.accentSoft : 'transparent', borderColor: colors.border }]}><Pressable onPress={() => router.push(`/move/${move.id}`)} accessibilityRole="button" accessibilityLabel={`${index + 1}, ${activity.name}`} style={[s.row, s.flex]}><T variant="heading" color={index < 3 ? colors.accentPressed : colors.muted} style={styles.rankNumber}>{String(index + 1).padStart(2, '0')}</T><Photo image={activity.image} style={styles.rankPhoto} /><View style={s.flex}><T variant="label">{activity.name}</T><T variant="caption">{move.placeName ?? activity.placeName}</T></View></Pressable><View {...pan.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel={`Reorder ${activity.name}`} accessibilityValue={{ now: index + 1, min: 1, max: count }} accessibilityActions={[{ name: 'increment', label: 'Move down' }, { name: 'decrement', label: 'Move up' }]} onAccessibilityAction={event => onReorder(index, event.nativeEvent.actionName === 'increment' ? Math.min(count - 1, index + 1) : Math.max(0, index - 1))} style={styles.handle}><Feather name="menu" size={18} color={colors.muted} /></View></View></Animated.View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, eyebrow: { fontWeight: '800', letterSpacing: .7 }, strong: { fontWeight: '800' }, link: { marginTop: 8 }, comparePeople: { justifyContent: 'center' }, profileHero: { gap: 16 }, identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, avatarRing: { borderWidth: 3, borderRadius: 44, padding: 2 }, stats: { flex: 1, flexDirection: 'row' }, nameBlock: { gap: 5 }, nameLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }, badgeSmall: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }, profileActions: { flexDirection: 'row', gap: 8 }, travelBand: { borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 }, travelMark: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, overlap: { flexDirection: 'row', alignItems: 'center', gap: 16, borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 14 }, tabs: { flexDirection: 'row', borderBottomWidth: 1 }, tab: { flex: 1, alignItems: 'center', paddingVertical: 13, borderBottomWidth: 3, minHeight: 48 }, publicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, publicTile: { width: '48.5%' }, publicImage: { width: '100%', aspectRatio: .9, borderRadius: 12 }, publicOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 11, paddingTop: 28, gap: 2, backgroundColor: 'rgba(16,15,14,.58)' }, visibility: { position: 'absolute', top: 7, right: 7, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, rankRow: { height: 72, paddingVertical: 10, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }, rankNumber: { width: 28, textAlign: 'center' }, rankPhoto: { width: 46, height: 46, borderRadius: 9 }, handle: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
});
