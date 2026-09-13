import React, { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { ActivityRow, Avatar, AvatarStack, Button, Chip, Empty, Field, Photo, Screen, Section, T } from '@/components/ui';
import { activities, categoryLabels, currentUserId, users } from '@/data/seed';
import { useAppStore } from '@/stores/app';
import { useUIStore } from '@/stores/ui';
import { useTheme } from '@/theme';
import type { ActivityCategory, Move } from '@/types';
import { FlowEnter, FlowHeader, locationLabels, PrivacySheet, visibilityLabels } from './FlowParts';

const recentActivityIds = ['basketball', 'shawarma', 'lift', 'movie', 'study'];
const locationSuggestions: Partial<Record<ActivityCategory, string[]>> = {
  active: ['ARC', 'CRCE', 'Outdoor courts'], food: ['Shawarma Joint', 'At home', 'Downtown Champaign'],
  outdoors: ['Japan House', 'The Main Quad', 'Around campus'], chill: ['At home', "A friend's place", 'The Main Quad'],
  games: ["A friend's place", 'Illini Union', 'At home'], campus: ['Main Library', 'Illini Union', 'The Main Quad'],
};
const stepCopy = [
  { title: 'What did you do?', subtitle: 'Big nights. Small rituals. It all counts.' },
  { title: 'Where was it?', subtitle: 'A place is optional. The experience comes first.' },
  { title: 'Who were you with?', subtitle: 'Good company is part of the move.' },
  { title: 'Anything worth remembering?', subtitle: 'A photo, a little note, or just the memory.' },
];

export default function LogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ activityId?: string; activity?: string }>();
  const initialId = params.activityId ?? params.activity;
  const initialActivity = activities.find(activity => activity.id === initialId);
  const { colors, radius } = useTheme();
  const defaultVisibility = useAppStore(state => state.defaultVisibility);
  const crews = useAppStore(state => state.crews);
  const logMove = useAppStore(state => state.logMove);
  const showToast = useUIStore(state => state.showToast);
  const cameraDraftUri = useUIStore(state => state.cameraDraftUri);
  const setCameraDraftUri = useUIStore(state => state.setCameraDraftUri);
  const [step, setStep] = useState(initialActivity ? 1 : 0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ActivityCategory | null>(null);
  const [activityId, setActivityId] = useState(initialActivity?.id ?? '');
  const [placeName, setPlaceName] = useState(initialActivity?.placeName ?? '');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [pickedPhoto, setPickedPhoto] = useState<string>();
  const [dateOffset, setDateOffset] = useState(0);
  const [visibility, setVisibility] = useState<Move['visibility']>(defaultVisibility);
  const [locationVisibility, setLocationVisibility] = useState<Move['locationVisibility']>('approximate');
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [savedMoveId, setSavedMoveId] = useState<string>();
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const activity = activities.find(item => item.id === activityId);
  const photo = cameraDraftUri ?? pickedPhoto;
  const friends = users.filter(user => user.id !== currentUserId);
  const listedActivities = useMemo(() => {
    if (query.trim() || category) return activities.filter(item => (!category || item.category === category) && `${item.name} ${item.placeName ?? ''} ${categoryLabels[item.category]}`.toLowerCase().includes(query.toLowerCase().trim()));
    return recentActivityIds.map(id => activities.find(item => item.id === id)).filter((item): item is (typeof activities)[number] => !!item);
  }, [query, category]);
  const places = useMemo(() => Array.from(new Set([activity?.placeName, ...(locationSuggestions[activity?.category ?? 'other'] ?? ['Around campus', 'At home', "A friend's place"]), 'At home'].filter((place): place is string => !!place))), [activity]);

  const changeStep = (next: number) => { scrollRef.current?.scrollTo({ y: 0, animated: false }); setStep(next); };
  const back = () => { if (step > 0) changeStep(step - 1); else router.back(); };
  const selectActivity = (id: string) => {
    setActivityId(id);
    setPlaceName(activities.find(item => item.id === id)?.placeName ?? '');
    void Haptics.selectionAsync();
  };
  const choosePlace = (place: string) => {
    setPlaceName(place);
    if (/home|friend|apartment/i.test(place)) setLocationVisibility('hidden');
  };
  const togglePerson = (id: string) => {
    setParticipantIds(previous => previous.includes(id) ? previous.filter(person => person !== id) : [...previous, id]);
    void Haptics.selectionAsync();
  };
  const toggleCrew = (ids: string[]) => {
    const peers = ids.filter(id => id !== currentUserId);
    setParticipantIds(previous => peers.every(id => previous.includes(id)) ? previous.filter(id => !peers.includes(id)) : Array.from(new Set([...previous, ...peers])));
    void Haptics.selectionAsync();
  };
  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
      if (!result.canceled && result.assets[0]) { setPickedPhoto(result.assets[0].uri); setCameraDraftUri(null); }
    } catch { showToast('Couldn’t open your photos. You can still log this move.'); }
  };
  const submit = () => {
    if (!activity || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const occurred = new Date();
      occurred.setDate(occurred.getDate() - dateOffset);
      const id = logMove({ activityId: activity.id, category: activity.category, placeName: placeName.trim() || undefined, date: occurred.toISOString(), note: note.trim() || undefined, photo, participantIds, confirmedParticipantIds: [], visibility, locationVisibility: !placeName.trim() || /home|friend|apartment/i.test(placeName) ? 'hidden' : locationVisibility });
      if (cameraDraftUri) { setPickedPhoto(cameraDraftUri); setCameraDraftUri(null); }
      setSavedMoveId(id);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      showToast('Couldn’t save that move. Your details are still here—try again.');
      savingRef.current = false;
    } finally { setSaving(false); }
  };

  if (savedMoveId && activity) return (
    <Screen scroll={false} padded={false}>
      <View style={styles.successTop}><T variant="caption" color={colors.textSecondary}>SAVED TO YOUR HISTORY</T></View>
      <ScrollView contentContainerStyle={styles.successContent}>
        <FlowEnter style={styles.successIntro}>
          <View style={[styles.successCheck, { backgroundColor: colors.successSoft }]}><Feather name="check" size={28} color={colors.success} /></View>
          <T variant="display">Nice.</T>
          <T variant="body" color={colors.textSecondary}>One more memory in the books.</T>
        </FlowEnter>
        <FlowEnter style={[styles.savedCard, { backgroundColor: colors.surface, borderRadius: radius.xl }]}>
          <Photo image={photo ?? activity.image} style={styles.savedPhoto} />
          <View style={styles.savedDetails}><T variant="heading">{activity.name}</T>{placeName ? <T color={colors.textSecondary}>{placeName}</T> : null}
            {participantIds.length ? <View style={styles.row}><AvatarStack ids={[currentUserId, ...participantIds]} size={30} /><T variant="caption" color={colors.textSecondary}>With your people</T></View> : null}
            {note.trim() ? <T variant="small">“{note.trim()}”</T> : null}
          </View>
        </FlowEnter>
        <View style={styles.successIntro}><T variant="title">Where does it rank?</T><T color={colors.textSecondary} style={styles.centerText}>A couple of choices help us learn what you love.</T></View>
      </ScrollView>
      <View style={styles.footer}><Button title="Rank it" icon="arrow-right" onPress={() => router.replace(`/rank/${savedMoveId}`)} /><Button title="Later" variant="ghost" onPress={() => { showToast('Saved. You can rank it from your profile anytime.'); router.replace('/(tabs)/home'); }} /></View>
    </Screen>
  );

  return (
    <Screen scroll={false} padded={false}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlowHeader step={step} onBack={back} />
        <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.content}>
          <FlowEnter key={step}>
            <T variant="title">{stepCopy[step].title}</T>
            <T variant="body" color={colors.textSecondary} style={styles.subtitle}>{stepCopy[step].subtitle}</T>
            {step === 0 ? <>
              <Field value={query} onChangeText={setQuery} placeholder="Search activities" accessibilityLabel="Search activities" returnKeyType="search" />
              <View style={styles.sectionGap}><Section title={query || category ? 'Activities' : 'Recent'} action={category ? 'Clear filter' : undefined} onAction={() => setCategory(null)} />
                <View style={styles.list}>{listedActivities.map(item => <ActivityRow key={item.id} activity={item} onPress={() => selectActivity(item.id)} subtitle={categoryLabels[item.category]} right={<Feather name={activityId === item.id ? 'check-circle' : 'circle'} size={22} color={activityId === item.id ? colors.accent : colors.border} />} />)}</View>
                {!listedActivities.length ? <Empty title="Nothing here yet" body="Try another activity name or clear the category." action="Clear search" onAction={() => { setQuery(''); setCategory(null); }} /> : null}
              </View>
              <View style={styles.sectionGap}><Section title="Find your kind of move" /><View style={styles.chips}>{(Object.keys(categoryLabels) as ActivityCategory[]).map(key => <Chip key={key} label={categoryLabels[key]} selected={category === key} onPress={() => setCategory(category === key ? null : key)} />)}</View></View>
            </> : null}
            {step === 1 ? <>
              {activity ? <View style={styles.selectedActivity}><ActivityRow activity={activity} subtitle="Your move" /></View> : null}
              <Field value={placeName} onChangeText={choosePlace} placeholder="Add a place or a general area" accessibilityLabel="Place, optional" returnKeyType="done" />
              <View style={styles.sectionGap}><Section title="A few nearby spots" /><View style={styles.list}>{places.map(place => <Pressable key={place} accessibilityRole="radio" accessibilityState={{ checked: placeName === place }} onPress={() => choosePlace(place)} style={[styles.placeOption, { backgroundColor: placeName === place ? colors.accentSoft : colors.surface, borderRadius: radius.md }]}><View style={[styles.placeIcon, { backgroundColor: colors.surfaceAlt }]}><Feather name={/home/i.test(place) ? 'home' : 'map-pin'} color={colors.textSecondary} size={20} /></View><T style={styles.flex}>{place}</T>{placeName === place ? <Feather name="check" size={20} color={colors.accent} /> : null}</Pressable>)}</View></View>
              <View style={[styles.quietNote, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md }]}><Feather name="shield" size={18} color={colors.textSecondary} /><T variant="small" color={colors.textSecondary} style={styles.flex}>Home and private places stay hidden by default.</T></View>
            </> : null}
            {step === 2 ? <>
              <View style={styles.people}>{friends.map(person => <Pressable key={person.id} accessibilityRole="checkbox" accessibilityState={{ checked: participantIds.includes(person.id) }} accessibilityLabel={person.displayName} onPress={() => togglePerson(person.id)} style={[styles.person, { backgroundColor: participantIds.includes(person.id) ? colors.accentSoft : colors.surface, borderRadius: radius.md, borderColor: participantIds.includes(person.id) ? colors.accent : colors.border }]}><Avatar userId={person.id} size={62} /><T variant="label" numberOfLines={1}>{person.displayName.split(' ')[0]}</T><Feather name={participantIds.includes(person.id) ? 'check-circle' : 'plus-circle'} size={21} color={participantIds.includes(person.id) ? colors.accent : colors.muted} /></Pressable>)}</View>
              <View style={styles.sectionGap}><Section title="Or bring the crew" /><View style={styles.list}>{crews.map(crew => { const peers = crew.memberIds.filter(id => id !== currentUserId); const selected = peers.length > 0 && peers.every(id => participantIds.includes(id)); return <Pressable key={crew.id} onPress={() => toggleCrew(crew.memberIds)} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} style={[styles.crew, { backgroundColor: selected ? colors.accentSoft : colors.surface, borderRadius: radius.md }]}><AvatarStack ids={crew.memberIds} size={28} /><T variant="label" style={styles.flex}>{crew.name}</T><Feather name={selected ? 'check-circle' : 'plus'} size={20} color={selected ? colors.accent : colors.textSecondary} /></Pressable>; })}</View></View>
              <T variant="small" color={colors.textSecondary} style={styles.footnote}>They’ll confirm before it enters their history. In this local demo, tags stay on your device.</T>
            </> : null}
            {step === 3 ? <>
              <Pressable accessibilityRole="button" accessibilityLabel={photo ? 'Retake photo' : 'Open rear camera'} onPress={() => router.push('/camera')} style={[styles.photoPicker, { backgroundColor: colors.surfaceAlt, borderRadius: radius.xl, borderColor: colors.border }]}>
                {photo ? <Photo image={photo} style={styles.photoPreview}><View style={styles.retake}><Feather name="camera" size={16} color="#fff" /><T variant="caption" color="#fff">Retake</T></View></Photo> : <><View style={[styles.photoIcon, { backgroundColor: colors.accentSoft }]}><Feather name="camera" size={27} color={colors.accentPressed} /></View><T variant="heading">Snap the Move</T><T variant="caption" color={colors.textSecondary}>Rear camera opens first</T></>}
              </Pressable>
              <View style={styles.photoActions}><Button title={photo ? 'Retake' : 'Open camera'} icon="camera" onPress={() => router.push('/camera')} style={styles.flex} /><Button title="Camera roll" icon="image" variant="secondary" onPress={() => { void pickPhoto(); }} style={styles.flex} /></View>
              {photo ? <Button title="Remove photo" variant="ghost" onPress={() => { setPickedPhoto(undefined); setCameraDraftUri(null); }} /> : null}
              <View style={styles.sectionGap}><Field value={note} onChangeText={setNote} placeholder="The little thing you want to remember…" multiline maxLength={280} accessibilityLabel="Optional memory note" textAlignVertical="top" style={styles.noteInput} /><T variant="caption" color={colors.muted} style={styles.counter}>{note.length}/280</T></View>
              <View style={styles.sectionGap}><Section title="When was it?" /><View style={styles.chips}>{[{ label: 'Today', offset: 0 }, { label: 'Yesterday', offset: 1 }, { label: 'Two days ago', offset: 2 }].map(option => <Chip key={option.offset} label={option.label} selected={dateOffset === option.offset} onPress={() => setDateOffset(option.offset)} />)}</View></View>
              <Pressable onPress={() => setPrivacyOpen(true)} accessibilityRole="button" accessibilityLabel={`Privacy: ${visibilityLabels[visibility]}. Location: ${locationLabels[locationVisibility]}. Change privacy settings`} style={[styles.privacyRow, { backgroundColor: colors.surface, borderRadius: radius.md }]}><Feather name={visibility === 'private' ? 'lock' : visibility === 'public' ? 'globe' : 'users'} color={colors.textSecondary} size={20} /><View style={styles.flex}><T variant="label">{visibilityLabels[visibility]}</T><T variant="caption" color={colors.textSecondary}>Location: {!placeName.trim() || /home|friend|apartment/i.test(placeName) ? 'Hidden' : locationLabels[locationVisibility]}</T></View><Feather name="chevron-right" color={colors.muted} size={19} /></Pressable>
            </> : null}
          </FlowEnter>
        </ScrollView>
        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          <Button title={step === 3 ? 'Log move' : 'Next'} icon={step === 3 ? 'check' : 'arrow-right'} onPress={() => step === 3 ? submit() : changeStep(step + 1)} disabled={!activity} loading={saving} />
          {step === 1 ? <Button title="Skip location" variant="ghost" onPress={() => { setPlaceName(''); setLocationVisibility('hidden'); changeStep(2); }} /> : null}
          {step === 2 ? <Button title={participantIds.length ? 'It was a solo move' : 'Just me'} variant="ghost" onPress={() => { setParticipantIds([]); changeStep(3); }} /> : null}
        </View>
      </KeyboardAvoidingView>
      <PrivacySheet visible={privacyOpen} onClose={() => setPrivacyOpen(false)} visibility={visibility} locationVisibility={locationVisibility} onVisibility={setVisibility} onLocationVisibility={setLocationVisibility} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 }, subtitle: { marginTop: 8, marginBottom: 24 },
  sectionGap: { marginTop: 24 }, list: { gap: 8 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 14, gap: 4 }, selectedActivity: { marginBottom: 24 },
  placeOption: { minHeight: 66, flexDirection: 'row', gap: 12, padding: 12, alignItems: 'center' }, placeIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  quietNote: { padding: 16, marginTop: 24, gap: 12, flexDirection: 'row', alignItems: 'center' },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, person: { minWidth: '45%', flex: 1, alignItems: 'center', paddingVertical: 20, gap: 10, borderWidth: 1 },
  crew: { minHeight: 68, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }, footnote: { marginTop: 24, lineHeight: 21 },
  photoPicker: { minHeight: 226, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, overflow: 'hidden' }, photoIcon: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }, photoPreview: { width: '100%', height: 226 }, photoActions: { flexDirection: 'row', gap: 10, marginTop: 12 }, retake: { position: 'absolute', right: 12, bottom: 12, backgroundColor: 'rgba(0,0,0,.58)', borderRadius: 13, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  noteInput: { minHeight: 104 }, counter: { textAlign: 'right', marginTop: 6 }, privacyRow: { marginTop: 24, minHeight: 76, padding: 16, gap: 12, flexDirection: 'row', alignItems: 'center' },
  successTop: { alignItems: 'center', padding: 24 }, successContent: { paddingHorizontal: 24, paddingVertical: 16, gap: 28 }, successIntro: { alignItems: 'center', gap: 10 }, successCheck: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  savedCard: { overflow: 'hidden' }, savedPhoto: { width: '100%', height: 228 }, savedDetails: { padding: 20, gap: 8 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }, centerText: { textAlign: 'center', maxWidth: 280 },
});
