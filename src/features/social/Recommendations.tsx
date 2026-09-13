import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, useReducedMotion } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header, T, Button, Chip, Photo, AvatarStack, Sheet, Empty, Field } from '@/components/ui';
import { TasteprintShape } from '@/components/TasteprintShape';
import { useTheme } from '@/theme';
import { useAppStore } from '@/stores/app';
import { activities, users, currentUserId } from '@/data/seed';
import { crewTaste, recommend } from '@/services/engine';
import type { Constraints, TasteVector } from '@/types';
import { s, memberVectors, personalTaste, Badge } from './shared';

function MergeShape({ vector, index, reduced }: { vector: TasteVector; index: number; reduced: boolean }) {
  const progress = useSharedValue(0);
  useEffect(() => { progress.value = withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.cubic) }); }, [progress]);
  const style = useAnimatedStyle(() => ({ opacity: 0.72 + progress.value * 0.28, transform: reduced ? [] : [{ translateX: (index % 2 ? 66 : -66) * (1 - progress.value) }, { translateY: (index < 2 ? -55 : 55) * (1 - progress.value) }, { scale: 0.8 + progress.value * 0.4 }] }));
  return <Animated.View style={[styles.mergeShape, style]}><TasteprintShape vector={vector} size={164} /></Animated.View>;
}
function Merge({ vectors }: { vectors: TasteVector[] }) {
  const reduced = useReducedMotion();
  const [line, setLine] = useState(0);
  useEffect(() => { const timer = setTimeout(() => setLine(1), 750); return () => clearTimeout(timer); }, []);
  return <View style={[s.center, { paddingVertical: 64 }]}><View style={styles.mergeArea}>{vectors.slice(0, 4).map((vector, index) => <MergeShape key={index} vector={vector} index={index} reduced={reduced} />)}</View><T variant="heading">{line ? "Looking for something new…" : 'Finding the overlap…'}</T><T variant="body" style={{ marginTop: 8 }}>A little of everyone. Something for all of you.</T></View>;
}
export function RecommendationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { crews, moves, createProposal } = useAppStore();
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [constraints, setConstraints] = useState<Constraints>({ when: 'Tonight', energy: 'medium', budget: 1, radius: 8 });
  const [alternative, setAlternative] = useState(0);
  const [why, setWhy] = useState(false);
  const [customWhen, setCustomWhen] = useState('');
  const [whenError, setWhenError] = useState(false);
  const crew = crews.find(c => c.id === id);
  const vectors = useMemo(() => crew ? memberVectors(crew, moves) : [], [crew, moves]);
  const results = useMemo(() => crew ? recommend(crew, users.map(u => u.id === currentUserId ? { ...u, taste: personalTaste(moves) } : u), activities, moves, constraints).slice(0, 3) : [], [crew, moves, constraints]);
  useEffect(() => { if (step !== 3) return; const timer = setTimeout(() => setStep(4), 1700); return () => clearTimeout(timer); }, [step]);
  if (!crew) return <Screen><Header back /><Empty title="Let's find your crew." body="Choose your people first." action="View crews" onAction={() => router.replace('/(tabs)/crews')} /></Screen>;
  const set = (patch: Partial<Constraints>) => { setConstraints(previous => ({ ...previous, ...patch })); void Haptics.selectionAsync(); };
  const next = () => {
    if (step === 0 && constraints.when === 'Pick a time') {
      const date = new Date(customWhen);
      if (Number.isNaN(date.getTime()) || date.getTime() < Date.now()) { setWhenError(true); return; }
      set({ when: date.toISOString() });
    }
    setStep(previous => previous + 1);
  };
  const makeProposal = () => {
    const result = results[alternative]; if (!result) return;
    let date = new Date();
    if (constraints.when === 'Tomorrow') date.setDate(date.getDate() + 1);
    else if (constraints.when === 'This weekend') date.setDate(date.getDate() + ((6 - date.getDay() + 7) % 7));
    if (!Number.isNaN(new Date(constraints.when).getTime())) date = new Date(constraints.when);
    else { date.setHours(19, 30, 0, 0); if (date.getTime() < Date.now()) date = new Date(Date.now() + 60 * 60 * 1000); }
    const proposalId = createProposal({ crewId: crew.id, activityId: result.activity.id, scheduledAt: date.toISOString(), fit: result.score, reasons: result.reasons });
    router.push(`/proposal/${proposalId}`);
  };
  if (step < 3) return <Screen><Header back title={crew.name} /><View style={[s.row, { marginTop: 12, marginBottom: 28 }]}>{[0, 1, 2].map(n => <Pressable key={n} disabled={n > step} onPress={() => setStep(n)} accessibilityLabel={`Step ${n + 1}`} style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: n <= step ? colors.accent : colors.border }} />)}<T variant="caption">{step + 1}/3</T></View>
    <AvatarStack ids={crew.memberIds} size={38} /><T variant="display" style={{ marginTop: 24, marginBottom: 12 }}>{step === 0 ? "When's the move?" : step === 1 ? 'How much energy?' : "What's the budget?"}</T><T variant="body" style={{ marginBottom: 32 }}>{step === 0 ? 'Make a little room for real life.' : step === 1 ? "We'll meet you where you're at." : 'A good time should feel good afterward, too.'}</T>
    <View style={s.gap}>{step === 0 ? <>{['Tonight', 'Tomorrow', 'This weekend', 'Pick a time'].map(when => <Choice key={when} title={when} subtitle={when === 'Tonight' ? 'Something to look forward to' : undefined} selected={constraints.when === when || when === 'Pick a time' && !['Tonight', 'Tomorrow', 'This weekend'].includes(constraints.when)} onPress={() => set({ when })} />)}{constraints.when === 'Pick a time' && <><Field value={customWhen} onChangeText={text => { setCustomWhen(text); setWhenError(false); }} placeholder="2026-09-18 19:30" accessibilityLabel="Date and time, year month day hours minutes" /><T variant="caption" color={whenError ? colors.accent : colors.textSecondary}>{whenError ? 'Choose a future date and time.' : 'Use your local time: YYYY-MM-DD HH:MM.'}</T></>}</> : step === 1 ? <>{([{ key: 'low', name: 'Low key', text: 'A soft landing for the day', icon: 'coffee' }, { key: 'medium', name: 'Up for something', text: 'A little movement, a little adventure', icon: 'sun' }, { key: 'high', name: 'All in', text: 'Bring on the big energy', icon: 'activity' }, { key: 'any', name: 'Surprise us', text: 'Find our best fit', icon: 'shuffle' }] as const).map(option => <Choice key={option.key} title={option.name} subtitle={option.text} icon={option.icon} selected={constraints.energy === option.key} onPress={() => set({ energy: option.key })} />)}</> : <><View style={s.wrap}>{[{ label: 'Free', value: 0 }, { label: '$', value: 1 }, { label: '$$', value: 2 }, { label: 'Any', value: 3 }].map(option => <Chip key={option.value} label={option.label} selected={constraints.budget === option.value} onPress={() => set({ budget: option.value as Constraints['budget'] })} />)}</View><T variant="heading" style={{ marginTop: 24 }}>How far?</T><View style={s.wrap}>{[{ label: 'Campus', value: 3 }, { label: 'Nearby', value: 8 }, { label: 'Anywhere', value: 500 }].map(option => <Chip key={option.value} label={option.label} selected={constraints.radius === option.value} onPress={() => set({ radius: option.value })} />)}</View><View style={[s.center, { paddingVertical: 20 }]}><TasteprintShape vector={crewTaste(vectors)} size={180} /></View></>}</View>
    <Button title={step === 2 ? 'Find our move' : 'Continue'} onPress={next} style={{ marginTop: 32 }} />
  </Screen>;
  if (step === 3) return <Screen><Header title={crew.name} /><Merge vectors={vectors} /></Screen>;
  const result = results[alternative];
  if (!result) return <Screen><Header back title="A little more room?" /><Empty title="Let's open up the options." body="No moves fit every choice this time. Try a wider radius, more energy, or a different budget." action="Adjust preferences" onAction={() => setStep(0)} /></Screen>;
  return <Screen><Header back title="This could be the move" right={<Pressable accessibilityRole="button" onPress={() => setStep(0)} style={{ minHeight: 44, justifyContent: 'center' }}><T variant="label" color={colors.accent}>Adjust</T></Pressable>} />
    <Photo image={result.activity.image} style={styles.resultHero}><LinearGradient colors={['transparent', colors.overlay]} style={StyleSheet.absoluteFill} /><View style={styles.heroCopy}><AvatarStack ids={crew.memberIds} size={30} /><T variant="display" color={colors.white}>{result.activity.name}</T><T variant="body" color={colors.white}>{result.activity.placeName ?? 'Wherever you make it'}</T><Badge>{result.score}% Crew Fit</Badge></View></Photo>
    <View style={[s.row, { marginTop: 20, marginBottom: 20 }]}><Feather name="map-pin" size={16} color={colors.textSecondary} /><T variant="small">{result.activity.distance} mi · {result.activity.minutes} min · {result.activity.price === 0 ? 'Free' : '$'.repeat(result.activity.price)}</T></View>
    <T variant="heading">A little of everyone.</T><T variant="body" style={{ marginTop: 8, marginBottom: 16 }}>{result.reasons[0] ?? result.activity.description}</T>
    <Pressable accessibilityRole="button" onPress={() => setWhy(true)} style={{ minHeight: 44, justifyContent: 'center', marginBottom: 12 }}><T variant="label" color={colors.accent}>Why this fits your crew <Feather name="arrow-up-right" size={14} /></T></Pressable>
    <Button title="Make the move" icon="arrow-up-right" onPress={makeProposal} /><Button title={results.length > 1 ? 'Another one' : 'Adjust preferences'} variant="secondary" onPress={() => results.length > 1 ? setAlternative((alternative + 1) % results.length) : setStep(0)} style={{ marginTop: 10 }} />
    <T variant="caption" style={{ textAlign: 'center', marginTop: 16 }}>{alternative + 1} of {results.length} thoughtful picks · {crew.name}</T>
    <Sheet visible={why} onClose={() => setWhy(false)} title={`Why ${result.activity.name}?`}><View style={s.gap}>{result.reasons.map((reason, index) => <View style={[s.row, { alignItems: 'flex-start' }]} key={index}><Feather name="check-circle" size={20} color={colors.success} /><T variant="body" style={s.flex}>{reason}</T></View>)}<View style={s.center}><TasteprintShape vector={crewTaste(vectors)} size={205} /></View><T variant="caption">Based on your crew's tastes, past moves, and the preferences you chose.</T></View></Sheet>
  </Screen>;
}
function Choice({ title, subtitle, selected, onPress, icon }: { title: string; subtitle?: string; selected: boolean; onPress: () => void; icon?: keyof typeof Feather.glyphMap }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.choice, { backgroundColor: selected ? colors.accentSoft : colors.surface, borderColor: selected ? colors.accent : colors.border }]}>{icon && <Feather name={icon} size={22} color={selected ? colors.accent : colors.textSecondary} />}<View style={s.flex}><T variant="heading">{title}</T>{subtitle && <T variant="small" style={{ marginTop: 4 }}>{subtitle}</T>}</View><Feather name={selected ? 'check-circle' : 'circle'} size={21} color={selected ? colors.accent : colors.muted} /></Pressable>;
}
const styles = StyleSheet.create({ choice: { padding: 20, minHeight: 76, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 16 }, mergeArea: { width: 280, height: 280, alignItems: 'center', justifyContent: 'center', marginBottom: 40 }, mergeShape: { position: 'absolute' }, resultHero: { height: 350, width: '100%', borderRadius: 26, overflow: 'hidden' }, heroCopy: { position: 'absolute', bottom: 24, left: 22, right: 22, gap: 10 } });
