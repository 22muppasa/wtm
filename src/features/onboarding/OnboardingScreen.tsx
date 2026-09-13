import React, { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Avatar, Brand, Button, Chip, Field, Photo, Screen, Sheet, T } from '@/components/ui';
import { TasteprintShape } from '@/components/TasteprintShape';
import { activities, categoryLabels } from '@/data/seed';
import { calculateConfidence, calculateTaste } from '@/services/engine';
import { useAppStore } from '@/stores/app';
import { useTheme } from '@/theme';
import type { ActivityCategory, TasteVector, Visibility } from '@/types';
import { ChoiceCard, FlowEnter, FlowHeader, PrivacyOption } from '@/features/log/FlowParts';
import { chooseSeedRanking, seedPreviewMoves, seedRankingIds, startSeedRanking, type SeedRankingSession } from './seedRanking';

const axisDescriptions: Record<keyof TasteVector, { title: string; body: string }> = {
  effort: { title: 'You like getting into it.', body: 'Your first picks lean toward doing, moving, and joining in.' },
  social: { title: 'Better with company.', body: 'Experiences that bring people together rise in your rankings.' },
  novelty: { title: 'A little curious.', body: 'You make room for something you haven’t done before.' },
  obscurity: { title: 'Your own kind of good.', body: 'Some of your best moves are the less obvious ones.' },
  spontaneity: { title: 'Open to a detour.', body: 'Your favorites leave a little room for the unplanned.' },
  rawness: { title: 'Keep it real.', body: 'Your picks lean toward relaxed, hands-on experiences.' },
};

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, radius } = useTheme();
  const completeOnboarding = useAppStore(state => state.completeOnboarding);
  const setStoreCampus = useAppStore(state => state.setCampus);
  const setStoreVisibility = useAppStore(state => state.setVisibility);
  const [stage, setStage] = useState(0);
  const [campus, setCampus] = useState('UIUC');
  const [privacyChoice, setPrivacyChoice] = useState<'private' | 'friends' | 'choose'>('friends');
  const visibility: Visibility = privacyChoice === 'choose' ? 'private' : privacyChoice;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<ActivityCategory | null>(null);
  const [session, setSession] = useState<SeedRankingSession>();
  const [demoOpen, setDemoOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const finishingRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const shownActivities = filter ? activities.filter(activity => activity.category === filter) : activities;
  const previewMoves = useMemo(() => session ? seedPreviewMoves(session, visibility) : [], [session, visibility]);
  const taste = useMemo(() => calculateTaste(previewMoves, activities), [previewMoves]);
  const topAxes = (Object.keys(taste) as (keyof TasteVector)[]).sort((a, b) => taste[b] - taste[a]).slice(0, 2);
  const current = activities.find(activity => activity.id === session?.currentId);
  const opponent = session?.search ? activities.find(activity => activity.id === session.opponents[session.search!.index]) : undefined;
  const stageChange = (next: number) => { scrollRef.current?.scrollTo({ y: 0, animated: false }); setStage(next); };
  const toggle = (id: string) => {
    setSelectedIds(previous => previous.includes(id) ? previous.filter(selected => selected !== id) : [...previous, id]);
    if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => {});
  };
  const beginRanking = () => {
    if (selectedIds.length < 5) return;
    const next = startSeedRanking(selectedIds);
    setSession(next);
    stageChange(next.currentId ? 4 : 5);
  };
  const choose = (preferNew: boolean) => {
    if (!session) return;
    const next = chooseSeedRanking(session, preferNew);
    setSession(next);
    if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => {});
    if (!next.currentId) stageChange(5);
  };
  const finish = (demo: boolean) => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    if (!demo && session) {
      setStoreCampus(campus.trim() || 'UIUC');
      setStoreVisibility(visibility);
      completeOnboarding(seedRankingIds(session));
    } else completeOnboarding();
    router.replace('/(tabs)/home');
  };

  if (stage === 0) return (
    <Screen scroll={false} padded={false}>
      <View style={styles.welcomeHeader}><Brand size={45} /><T variant="caption" color={colors.textSecondary}>REAL LIFE, TOGETHER.</T></View>
      <Photo image="friends" style={[styles.welcomePhoto, { borderRadius: radius.hero }]}>
        <LinearGradient colors={['transparent', colors.overlay, colors.ink]} locations={[0.12, 0.42, 1]} style={styles.welcomeGradient}>
          <FlowEnter style={styles.welcomeCopy}>
            <View style={styles.welcomeEyebrow}><View style={[styles.dot, { backgroundColor: colors.accent }]} /><T variant="caption" color={colors.white}>WHAT’S THE MOVE?</T></View>
            <T variant="display" color={colors.white} style={styles.welcomeTitle}>What do you actually love doing?</T>
            <T color={colors.white} style={styles.welcomeDescription}>Rank the things you do.{'\n'}Discover your taste.{'\n'}Find better moves with your people.</T>
          </FlowEnter>
          <View style={styles.welcomeActions}><Button title="Get started" icon="arrow-right" onPress={() => stageChange(1)} /><Pressable accessibilityRole="button" onPress={() => setDemoOpen(true)} style={styles.existingAccount}><T variant="small" color={colors.white}>I already have an account</T></Pressable></View>
        </LinearGradient>
      </Photo>
      <Pressable accessibilityRole="button" onPress={() => setDemoOpen(true)} style={styles.demoLink}><T variant="caption" color={colors.textSecondary}>Just looking around? Try the demo</T><Feather name="arrow-up-right" size={14} color={colors.textSecondary} /></Pressable>
      <Sheet visible={demoOpen} onClose={() => setDemoOpen(false)} title="Meet your next good night">
        <View style={styles.demoIdentity}><Avatar userId="shawn" size={62} /><View style={styles.flex}><T variant="heading">Shawn’s WTM</T><T variant="small" color={colors.textSecondary}>UIUC · 72 moves · 4 crews</T></View></View>
        <T color={colors.textSecondary}>Explore the full app with a sample profile. Your changes are saved on this device. Account sign-in isn’t connected in this demo.</T>
        <Button title="Continue as Shawn" icon="arrow-right" loading={finishing} onPress={() => finish(true)} />
      </Sheet>
    </Screen>
  );

  return (
    <Screen scroll={false} padded={false}>
      <FlowHeader total={5} step={stage - 1} onBack={() => stageChange(stage >= 4 ? 3 : stage - 1)} />
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <FlowEnter key={stage}>
          {stage === 1 ? <>
            <T variant="title">Where are you?</T><T color={colors.textSecondary} style={styles.subtitle}>Good moves start a little closer to home.</T>
            <Photo image="walk" style={styles.campusPhoto}><LinearGradient colors={['transparent', colors.overlay]} style={styles.campusOverlay}><T variant="caption" color={colors.white}>YOUR STARTING POINT</T><T variant="heading" color={colors.white}>University of Illinois{'\n'}Urbana-Champaign</T></LinearGradient></Photo>
            <View style={styles.sectionGap}><Field value={campus} onChangeText={setCampus} placeholder="Your campus or city" accessibilityLabel="Your campus or city" returnKeyType="done" /></View>
            <View style={[styles.quietCard, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md }]}><Feather name="map-pin" color={colors.textSecondary} size={18} /><T color={colors.textSecondary} variant="small" style={styles.flex}>The demo’s local recommendations are around UIUC. You can change your home base anytime.</T></View>
          </> : null}
          {stage === 2 ? <>
            <View style={[styles.privacyIcon, { backgroundColor: colors.accentSoft }]}><Feather name="shield" color={colors.accent} size={32} /></View>
            <T variant="title">Your life isn’t automatically public.</T><T color={colors.textSecondary} style={styles.subtitle}>Your memories are yours. Choose a default for new moves.</T>
            <View style={styles.privacyOptions}><PrivacyOption title="Only me" description="A little space just for your own history." selected={privacyChoice === 'private'} onPress={() => setPrivacyChoice('private')} /><PrivacyOption title="Friends" description="Share the good stuff with your people." selected={privacyChoice === 'friends'} onPress={() => setPrivacyChoice('friends')} /><PrivacyOption title="Public when I choose" description="Start private. Make individual moves public later." selected={privacyChoice === 'choose'} onPress={() => setPrivacyChoice('choose')} /></View>
            <T variant="small" color={colors.textSecondary} style={styles.footnote}>You can change this for every move. Your exact location is always a separate choice.</T>
          </> : null}
          {stage === 3 ? <>
            <T variant="title">What have you actually done?</T><T color={colors.textSecondary} style={styles.subtitle}>Pick at least five things you’ve tried. We’ll take it from there.</T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}><Chip label="All moves" selected={filter === null} onPress={() => setFilter(null)} />{(Object.keys(categoryLabels) as ActivityCategory[]).filter(key => activities.some(activity => activity.category === key)).map(key => <Chip key={key} label={categoryLabels[key]} selected={filter === key} onPress={() => setFilter(key)} />)}</ScrollView>
            <View style={styles.seedGrid}>{shownActivities.map(activity => { const selected = selectedIds.includes(activity.id); return <Pressable key={activity.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={activity.name} onPress={() => toggle(activity.id)} style={[styles.seedCard, { backgroundColor: selected ? colors.accentSoft : colors.surface, borderRadius: radius.md, borderColor: selected ? colors.accent : 'transparent' }]}><Photo image={activity.image} style={styles.seedImage}><View style={[styles.seedCheck, { backgroundColor: selected ? colors.accent : colors.surface }]}><Feather name={selected ? 'check' : 'plus'} size={17} color={selected ? colors.text : colors.textSecondary} /></View></Photo><View style={styles.seedText}><T variant="label" numberOfLines={2}>{activity.name}</T><T variant="caption" color={colors.textSecondary}>{categoryLabels[activity.category]}</T></View></Pressable>; })}</View>
          </> : null}
          {stage === 4 && current && opponent ? <>
            <T variant="title">Which would you rather do again?</T><T color={colors.textSecondary} style={styles.subtitle}>One quick choice. Trust your gut.</T>
            <FlowEnter key={current.id + '-' + opponent.id} style={styles.tutorialChoices}><ChoiceCard activity={current} onPress={() => choose(true)} /><View style={styles.versus}><View style={[styles.versusLine, { backgroundColor: colors.border }]} /><T variant="caption" color={colors.textSecondary}>OR</T><View style={[styles.versusLine, { backgroundColor: colors.border }]} /></View><ChoiceCard activity={opponent} onPress={() => choose(false)} /></FlowEnter>
            <T variant="caption" color={colors.textSecondary} style={styles.footnote}>Only your {categoryLabels[current.category].toLowerCase()} moves are compared with each other.</T>
          </> : null}
          {stage === 5 ? <>
            <View style={styles.revealHeader}><T variant="title" style={styles.center}>We’re starting to get you.</T><T variant="body" color={colors.success}>{calculateConfidence(previewMoves.length)}% calibrated</T></View>
            <View style={styles.tasteprint}><TasteprintShape vector={taste} size={290} labels animated /></View>
            <T color={colors.textSecondary} style={[styles.center, styles.revealDescription]}>Your first {previewMoves.length} moves are in. Your taste will keep taking shape as you live a little more.</T>
            <View style={styles.insights}>{topAxes.map(axis => <View key={axis} style={[styles.insight, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md }]}><View style={[styles.insightIcon, { backgroundColor: colors.accentSoft }]}><Feather name={axis === 'social' ? 'users' : axis === 'effort' ? 'activity' : 'compass'} color={colors.accent} size={21} /></View><View style={styles.flex}><T variant="label">{axisDescriptions[axis].title}</T><T variant="small" color={colors.textSecondary}>{axisDescriptions[axis].body}</T></View></View>)}</View>
          </> : null}
        </FlowEnter>
      </ScrollView>
      <View style={styles.footer}>
        {stage === 1 ? <Button title="Continue" icon="arrow-right" disabled={!campus.trim()} onPress={() => stageChange(2)} /> : null}
        {stage === 2 ? <Button title="Continue" icon="arrow-right" onPress={() => stageChange(3)} /> : null}
        {stage === 3 ? <><T variant="caption" color={colors.textSecondary} style={styles.selectionCount}>{selectedIds.length < 5 ? selectedIds.length + ' selected · ' + (5 - selectedIds.length) + ' more to get started' : selectedIds.length + ' moves. Let’s find your favorites.'}</T><Button title={selectedIds.length < 5 ? 'Choose 5 moves' : 'Rank ' + selectedIds.length + ' moves'} disabled={selectedIds.length < 5} icon="arrow-right" onPress={beginRanking} /></> : null}
        {stage === 4 ? <T variant="caption" color={colors.muted} style={styles.center}>Your choices become your first rankings.</T> : null}
        {stage === 5 ? <Button title="See WTM" icon="arrow-right" loading={finishing} onPress={() => finish(false)} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, welcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20 }, welcomePhoto: { flex: 1, marginHorizontal: 16 }, welcomeGradient: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end', padding: 24, gap: 28 }, welcomeCopy: { gap: 16 }, welcomeEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, dot: { width: 6, height: 6, borderRadius: 3 }, welcomeTitle: { maxWidth: 320, fontSize: 38, lineHeight: 43 }, welcomeDescription: { lineHeight: 24 }, welcomeActions: { gap: 4 }, existingAccount: { minHeight: 44, justifyContent: 'center', alignItems: 'center' }, demoLink: { minHeight: 48, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }, demoIdentity: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }, subtitle: { marginTop: 10, marginBottom: 24 }, sectionGap: { marginTop: 24 }, campusPhoto: { height: 272 }, campusOverlay: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end', padding: 22, gap: 8 }, quietCard: { marginTop: 24, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, privacyIcon: { width: 72, height: 72, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }, privacyOptions: { gap: 4 }, footnote: { marginTop: 24, textAlign: 'center' },
  filters: { gap: 8, paddingBottom: 20 }, seedGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }, seedCard: { width: '48%', borderWidth: 2, overflow: 'hidden' }, seedImage: { height: 116, borderRadius: 12 }, seedCheck: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 9, right: 9 }, seedText: { padding: 10, minHeight: 64, gap: 3 }, selectionCount: { textAlign: 'center', marginBottom: 10 }, tutorialChoices: { gap: 8 }, versus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 3 }, versusLine: { width: 32, height: 1 },
  revealHeader: { alignItems: 'center', gap: 12 }, center: { textAlign: 'center' }, tasteprint: { alignItems: 'center', marginVertical: 20 }, revealDescription: { paddingHorizontal: 8 }, insights: { marginTop: 24, gap: 10 }, insight: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }, insightIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 14 },
});
