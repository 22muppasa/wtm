import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, LinearTransition, useReducedMotion } from 'react-native-reanimated';
import { ActivityRow, Button, Empty, IconButton, Screen, T } from '@/components/ui';
import { TasteprintShape } from '@/components/TasteprintShape';
import { activities, categoryLabels, currentUserId } from '@/data/seed';
import { calculateConfidence, calculateTaste, chooseRanking, startRanking } from '@/services/engine';
import { useAppStore } from '@/stores/app';
import { useUIStore } from '@/stores/ui';
import { useTheme } from '@/theme';
import type { TasteVector } from '@/types';
import { ChoiceCard, FlowEnter } from './FlowParts';

const traitNames: Record<keyof TasteVector, string> = { effort: 'Effort', novelty: 'Novelty', obscurity: 'Under the radar', spontaneity: 'Spontaneity', social: 'Crowd', rawness: 'Rawness' };

export default function RankingScreen() {
  const { moveId } = useLocalSearchParams<{ moveId: string }>();
  const router = useRouter();
  const { colors, radius } = useTheme();
  const reducedMotion = useReducedMotion();
  const moves = useAppStore(state => state.moves);
  const rankMove = useAppStore(state => state.rankMove);
  const showToast = useUIStore(state => state.showToast);
  const move = moves.find(item => item.id === moveId && item.userId === currentUserId);
  const activity = activities.find(item => item.id === move?.activityId);
  const [comparisonIds] = useState(() => moves.filter(item => item.userId === currentUserId && item.category === move?.category && item.id !== moveId && typeof item.rank === 'number').sort((a, b) => a.rank! - b.rank!).map(item => item.id));
  const [ranking, setRanking] = useState(() => startRanking(comparisonIds));
  const [comparisonNumber, setComparisonNumber] = useState(1);
  const [beforeTaste] = useState(() => calculateTaste(moves.filter(item => item.userId === currentUserId), activities));
  const [showResult, setShowResult] = useState(false);
  const committed = useRef(false);
  const choiceLocked = useRef(false);
  const choiceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opponent = moves.find(item => item.id === comparisonIds[ranking.index]);
  const opponentActivity = activities.find(item => item.id === opponent?.activityId);
  const rankedCategory = useMemo(() => moves.filter(item => item.userId === currentUserId && item.category === move?.category && typeof item.rank === 'number').sort((a, b) => a.rank! - b.rank!), [moves, move?.category]);
  const afterTaste = useMemo(() => calculateTaste(moves.filter(item => item.userId === currentUserId), activities), [moves]);
  const confidence = calculateConfidence(moves.filter(item => item.userId === currentUserId && typeof item.rank === 'number').length);
  const deltas = (Object.keys(afterTaste) as (keyof TasteVector)[]).map(axis => ({ axis, delta: Math.round(afterTaste[axis] - beforeTaste[axis]) })).filter(item => item.delta !== 0).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 2);
  const categoryName = move ? categoryLabels[move.category] : 'your moves';
  const placement = typeof move?.rank === 'number' ? move.rank : ranking.index + 1;
  const neighborsStart = Math.max(0, placement - 3);

  useEffect(() => () => { if (choiceTimer.current) clearTimeout(choiceTimer.current); }, []);
  useEffect(() => {
    if (!ranking.done || committed.current || !move) return;
    committed.current = true;
    rankMove(move.id, ranking.index);
    setShowResult(true);
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [ranking.done, ranking.index, move, rankMove]);

  const choose = (preferNew: boolean) => {
    if (choiceLocked.current || ranking.done) return;
    choiceLocked.current = true;
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setRanking(previous => chooseRanking(previous, preferNew));
    setComparisonNumber(previous => previous + 1);
    choiceTimer.current = setTimeout(() => { choiceLocked.current = false; }, 250);
  };
  const leaveUnranked = () => {
    showToast(move?.rank ? 'Your previous ranking is unchanged.' : 'Saved without a rank. Come back whenever you’re ready.');
    router.replace('/(tabs)/home');
  };

  if (!move || !activity) return <Screen><Empty title="Couldn’t find this move" body="Your history is still here. Try opening the move from your profile." action="Go to your profile" onAction={() => router.replace('/(tabs)/you')} /></Screen>;

  if (showResult) return (
    <Screen scroll={false} padded={false}>
      <ScrollView contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
        <FlowEnter style={styles.resultIntro}>
          <View style={[styles.resultCheck, { backgroundColor: colors.successSoft }]}><Feather name="check" size={20} color={colors.success} /></View>
          <T variant="title">Nice.</T>
          <T variant="small" color={colors.textSecondary}>{activity.name} lands at</T>
          <T variant="display" color={colors.accent} style={styles.bigRank}>#{placement}</T>
          <T variant="heading">in {categoryName}</T>
        </FlowEnter>
        <View style={styles.rankingRows}>
          {neighborsStart > 0 ? <T variant="caption" color={colors.muted} style={styles.aboveRows}>{neighborsStart} higher-ranked {neighborsStart === 1 ? 'move' : 'moves'}</T> : null}
          {rankedCategory.slice(neighborsStart, neighborsStart + 5).map((item, index) => {
            const rowActivity = activities.find(entry => entry.id === item.activityId);
            if (!rowActivity) return null;
            const isNew = item.id === move.id;
            return <Animated.View key={item.id} entering={reducedMotion ? FadeIn.duration(130) : FadeInDown.delay(index * 55).duration(230)} layout={reducedMotion ? undefined : LinearTransition.duration(240)} style={[styles.rankWrapper, { borderColor: isNew ? colors.accent : 'transparent', backgroundColor: isNew ? colors.accentSoft : colors.surface, borderRadius: radius.md }]}><ActivityRow activity={rowActivity} rank={item.rank} subtitle={isNew ? 'Just ranked · ' + (item.placeName ?? categoryName) : item.placeName} onPress={() => router.push(`/move/${item.id}`)} right={isNew ? <Feather name="check-circle" size={20} color={colors.accent} /> : <View />} /></Animated.View>;
          })}
        </View>
        <FlowEnter style={[styles.tasteCard, { backgroundColor: colors.surfaceAlt, borderRadius: radius.xl }]}>
          <View style={styles.tasteHeading}><View style={styles.flex}><T variant="heading">A little more you.</T><T variant="small" color={colors.textSecondary}>{confidence}% calibrated</T></View><Feather name="arrow-up-right" size={22} color={colors.textSecondary} /></View>
          <View style={styles.tasteBody}><TasteprintShape vector={afterTaste} overlay={beforeTaste} size={132} animated /><View style={styles.tasteDeltas}>{deltas.length ? deltas.map(({ axis, delta }) => <View style={styles.deltaRow} key={axis}><T variant="small">{traitNames[axis]}</T><T variant="heading" color={delta > 0 ? colors.success : colors.textSecondary}>{delta > 0 ? '+' : ''}{delta}</T></View>) : <T variant="small" color={colors.textSecondary}>Your taste is getting clearer, one choice at a time.</T>}</View></View>
          <Button title="See your Tasteprint" variant="ghost" onPress={() => router.push('/taste')} />
        </FlowEnter>
      </ScrollView>
      <View style={styles.footer}><Button title="Continue" icon="arrow-right" onPress={() => router.replace('/(tabs)/home')} /></View>
    </Screen>
  );

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}><IconButton name="arrow-left" label="Leave ranking" onPress={leaveUnranked} /><View style={styles.progressTrack}><View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${Math.min(90, ((comparisonIds.length - (ranking.high - ranking.low)) / Math.max(1, comparisonIds.length)) * 80 + 12)}%` }]} /><View style={[StyleSheet.absoluteFill, styles.trackBackground, { backgroundColor: colors.border }]} /></View><T variant="caption" color={colors.textSecondary}>{categoryName}</T></View>
      <ScrollView contentContainerStyle={styles.comparisonContent} showsVerticalScrollIndicator={false}>
        <T variant="title">Which would you rather do again?</T>
        <T color={colors.textSecondary} style={styles.comparisonSubtitle}>Go with your gut. There’s no wrong answer.</T>
        {opponent && opponentActivity ? <FlowEnter key={`${opponent.id}-${comparisonNumber}`} style={styles.comparisonCards}>
          <ChoiceCard activity={activity} placeName={move.placeName} subtitle="YOUR NEW MOVE" onPress={() => choose(true)} />
          <View style={styles.versus}><View style={[styles.versusLine, { backgroundColor: colors.border }]} /><T variant="caption" color={colors.textSecondary}>OR</T><View style={[styles.versusLine, { backgroundColor: colors.border }]} /></View>
          <ChoiceCard activity={opponentActivity} placeName={opponent.placeName} onPress={() => choose(false)} />
        </FlowEnter> : <Empty title="Ready for its place" body="This is your first ranked move in this category." />}
      </ScrollView>
      <View style={styles.footer}><Button title="Skip for now" variant="ghost" onPress={leaveUnranked} /><T variant="caption" color={colors.muted} style={styles.center}>Only compared with your {categoryName.toLowerCase()} moves.</T></View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 16 }, progressTrack: { flex: 1, maxWidth: 150, height: 5, borderRadius: 4, overflow: 'hidden', marginRight: 'auto' }, progressFill: { height: 5, borderRadius: 4, zIndex: 1 }, trackBackground: { zIndex: 0 },
  comparisonContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 }, comparisonSubtitle: { marginTop: 8, marginBottom: 24 }, comparisonCards: { gap: 8 }, versus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 3 }, versusLine: { height: 1, width: 32 }, footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12, gap: 4 }, center: { textAlign: 'center' },
  resultContent: { paddingHorizontal: 24, paddingVertical: 16, gap: 24 }, resultIntro: { alignItems: 'center', gap: 5 }, resultCheck: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, bigRank: { fontSize: 80, lineHeight: 90, letterSpacing: -4, marginTop: 2 },
  rankingRows: { gap: 7 }, rankWrapper: { borderWidth: 1, overflow: 'hidden', padding: 2 }, aboveRows: { textAlign: 'center', marginBottom: 4 }, tasteCard: { padding: 20, gap: 10 }, tasteHeading: { flexDirection: 'row', alignItems: 'center' }, tasteBody: { flexDirection: 'row', gap: 12, alignItems: 'center' }, tasteDeltas: { flex: 1, gap: 14 }, deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' },
});
