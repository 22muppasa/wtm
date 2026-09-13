import React, { useMemo, useState } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Screen, Header, T, Button, Section, ActivityRow, Chip, Empty } from '@/components/ui';
import { TasteprintShape } from '@/components/TasteprintShape';
import { useAppStore } from '@/stores/app';
import { useTheme } from '@/theme';
import { activities } from '@/data/seed';
import { calculateConfidence, calculateRange, calculateTaste, tasteEvidence } from '@/services/engine';
import type { TasteVector } from '@/types';
import { s, mine, personalTaste, axes, activityOf, Panel, RowLink, Badge } from './shared';

export function TraitBars({ vector, interactive = true }: { vector: TasteVector; interactive?: boolean }) {
  const { colors } = useTheme();
  return <View style={s.gap}>{axes.map(axis => <Pressable key={axis.key} disabled={!interactive} accessibilityRole={interactive ? 'button' : undefined} accessibilityLabel={`${axis.title}, ${Math.round(vector[axis.key])} out of 100`} onPress={() => router.push(`/taste/${axis.key}`)} style={{ minHeight: 48 }}><View style={s.between}><T variant="label">{axis.title}</T><T variant="small">{Math.round(vector[axis.key])}</T></View><View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}><View style={[styles.fill, { backgroundColor: colors.accent, width: `${vector[axis.key]}%` }]} /></View></Pressable>)}</View>;
}
export function TasteScreen() {
  const allMoves = useAppStore(state => state.moves);
  const moves = mine(allMoves);
  const [expanded, setExpanded] = useState(false);
  const { colors } = useTheme();
  const vector = useMemo(() => personalTaste(allMoves), [allMoves]);
  const evidence = tasteEvidence(moves, activities);
  const count = moves.filter(m => m.rank !== undefined).length;
  return <Screen><Header back title="Your Tasteprint" right={<Pressable onPress={() => router.push('/taste/history')} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}><T variant="label" color={colors.accent}>History</T></Pressable>} />
    <View style={[s.center, { paddingVertical: 12 }]}><Badge>{calculateConfidence(count)}% calibrated</Badge><TasteprintShape vector={vector} size={300} labels animated /><T variant="small" style={{ textAlign: 'center' }}>A little less who you say you are.\nA little more what you actually love.</T></View>
    {count < 3 ? <Empty title="Still learning you." body={`Rank ${Math.max(1, 3 - count)} more moves to start finding your patterns.`} action="Log a move" onAction={() => router.push('/log')} /> : <><Section title="What your moves say" /><View style={s.smallGap}>{evidence.slice(0, 3).map(insight => <RowLink key={insight.axis} title={insight.title} subtitle={insight.message} icon={axes.find(a => a.key === insight.axis)?.icon ?? 'activity'} onPress={() => router.push(`/taste/${insight.axis}`)} />)}</View></>}
    <Button title={expanded ? 'Show less' : 'Explore all six traits'} variant="secondary" onPress={() => setExpanded(!expanded)} style={{ marginTop: 24 }} />{expanded && <Panel style={{ marginTop: 16 }}><TraitBars vector={vector} /><T variant="caption">These scores describe your patterns. There is no ideal shape.</T></Panel>}
    <Section title="Your range" /><RowLink title={`${calculateRange(moves, activities)} · room for possibility`} subtitle="How broadly you explore beyond your usual patterns." icon="compass" onPress={() => router.push('/taste/range')} />
  </Screen>;
}
export function TasteAxisScreen() {
  const { axis: key } = useLocalSearchParams<{ axis: string }>();
  const allMoves = useAppStore(s => s.moves);
  const moves = mine(allMoves);
  const { colors } = useTheme();
  const axis = axes.find(item => item.key === key);
  const vector = personalTaste(allMoves);
  const insight = tasteEvidence(moves, activities).find(item => item.axis === key);
  if (!axis) return <Screen><Header back /><Empty title="Find your own shape." body="Explore the six dimensions of your Tasteprint." action="Your Tasteprint" onAction={() => router.replace('/taste')} /></Screen>;
  const contributing = insight?.moveIds.map(id => moves.find(move => move.id === id)).filter((move): move is typeof moves[number] => !!move) ?? [];
  return <Screen><Header back title={axis.title} /><View style={[s.center, { paddingVertical: 32 }]}><View style={[styles.axisIcon, { backgroundColor: colors.accentSoft }]}><Feather name={axis.icon} size={26} color={colors.accent} /></View><T variant="display" style={{ marginTop: 20 }}>{Math.round(vector[axis.key])}</T><T variant="small">your {axis.title.toLowerCase()} score · out of 100</T></View>
    <View style={[styles.spectrum, { backgroundColor: colors.surfaceAlt }]}><View style={[styles.spectrumDot, { left: `${Math.min(96, Math.max(4, vector[axis.key]))}%`, backgroundColor: colors.accent, borderColor: colors.background }]} /></View><View style={[s.between, { marginTop: 16 }]}><T variant="caption" style={{ flex: 1 }}>{axis.low}</T><T variant="caption" style={{ flex: 1, textAlign: 'right' }}>{axis.high}</T></View>
    <Section title="Why this looks like you" /><Panel><T variant="heading">{insight?.title ?? 'A pattern in the making'}</T><T variant="body">{insight?.message ?? 'Every ranked experience gives your Tasteprint more context. Keep logging what you actually do.'}</T><T variant="caption">Derived from the activities you rank and the experiences you log.</T></Panel>
    <Section title="The moves behind it" /><View style={s.smallGap}>{contributing.slice(0, 8).map(move => { const activity = activityOf(move.activityId); return activity ? <ActivityRow key={move.id} activity={activity} subtitle={move.rank ? `#${move.rank} in ${move.category}` : 'Part of your story'} onPress={() => router.push(`/move/${move.id}`)} /> : null; })}{!contributing.length && <T variant="body">Your first ranked moves will appear here.</T>}</View>
    <Button title="See how your taste changed" variant="secondary" onPress={() => router.push('/taste/history')} style={{ marginTop: 24 }} />
  </Screen>;
}
export function TasteHistoryScreen() {
  const allMoves = useAppStore(s => s.moves);
  const moves = useMemo(() => [...mine(allMoves)].sort((a, b) => a.date.localeCompare(b.date)), [allMoves]);
  const [index, setIndex] = useState(3);
  const counts = [Math.max(1, Math.floor(moves.length / 4)), Math.max(1, Math.floor(moves.length / 2)), Math.max(1, Math.floor(moves.length * .75)), moves.length];
  const selected = moves.slice(0, counts[index]);
  const vector = calculateTaste(selected, activities);
  const first = calculateTaste(moves.slice(0, counts[0]), activities);
  const biggest = [...axes].sort((a, b) => Math.abs(vector[b.key] - first[b.key]) - Math.abs(vector[a.key] - first[a.key]))[0];
  const delta = Math.round(vector[biggest.key] - first[biggest.key]);
  return <Screen><Header back title="Your taste, over time" /><T variant="display" style={{ marginTop: 12 }}>You're changing.</T><T variant="body" style={{ marginTop: 8 }}>Your life leaves a shape.</T><View style={[s.center, { marginVertical: 20 }]}><TasteprintShape vector={vector} size={280} overlay={first} labels animated /></View>
    <View style={[s.wrap, { justifyContent: 'center' }]}>{counts.map((count, n) => <Chip key={n} label={n === 3 ? 'Now' : `${count} moves`} selected={n === index} onPress={() => setIndex(n)} />)}</View>
    <Panel style={{ marginTop: 24 }}><T variant="title">{biggest.title} {delta > 0 ? '+' : ''}{delta}</T><T variant="body">{delta === 0 ? 'The beginning of a pattern.' : delta > 0 ? `More drawn to ${biggest.high.toLowerCase()}.` : `More drawn to ${biggest.low.toLowerCase()}.`}</T><T variant="caption">Comparing your first {counts[0]} moves with your first {counts[index]}. Each shape is calculated from that history.</T></Panel>
    <Section title="From this chapter" /><View style={s.smallGap}>{[...selected].reverse().slice(0, 4).map(move => { const activity = activityOf(move.activityId); return activity ? <ActivityRow key={move.id} activity={activity} onPress={() => router.push(`/move/${move.id}`)} /> : null; })}</View>
  </Screen>;
}
export function RangeScreen() {
  const moves = mine(useAppStore(s => s.moves));
  const range = calculateRange(moves, activities);
  const tried = new Set(moves.map(m => m.activityId));
  const broadening = [...activities].filter(a => tried.has(a.id)).sort((a, b) => b.traits.novelty - a.traits.novelty).slice(0, 3);
  const suggestions = [...activities].filter(a => !tried.has(a.id)).sort((a, b) => b.traits.novelty - a.traits.novelty).slice(0, 3);
  return <Screen><Header back title="Your range" /><View style={[s.center, { paddingVertical: 36 }]}><T variant="display">{range}</T><T variant="heading">Range</T><T variant="body" style={{ marginTop: 12, textAlign: 'center' }}>How broadly you explore beyond\nyour usual patterns.</T></View><Panel><T variant="body">You've tried {tried.size} activities across {new Set(moves.map(m => m.category)).size} categories.</T><T variant="small">Range grows with variety. You don't need a passport or an expensive plan.</T></Panel><Section title="You made room for" /><View style={s.smallGap}>{broadening.map(activity => <ActivityRow key={activity.id} activity={activity} onPress={() => router.push(`/activity/${activity.id}`)} />)}</View><Section title="A little outside your usual" /><View style={s.smallGap}>{suggestions.map(activity => <ActivityRow key={activity.id} activity={activity} onPress={() => router.push(`/activity/${activity.id}`)} />)}{!suggestions.length && <T variant="body">You've explored the whole collection. Revisit a favorite with different people.</T>}</View></Screen>;
}
const styles = StyleSheet.create({ track: { height: 6, borderRadius: 4, marginTop: 12, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 4 }, axisIcon: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, spectrum: { height: 10, borderRadius: 5 }, spectrumDot: { position: 'absolute', width: 26, height: 26, borderRadius: 13, marginLeft: -13, top: -8, borderWidth: 4 } });
