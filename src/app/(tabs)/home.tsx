import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityCard, ActivityRow, Avatar, AvatarStack, Brand, Button, Chip, Field, IconButton, Photo, Screen, Section, Sheet, T } from '@/components/ui';
import { TasteprintShape } from '@/components/TasteprintShape';
import { useTheme } from '@/theme';
import { useAppStore } from '@/stores/app';
import { useUIStore } from '@/stores/ui';
import { catalog } from '@/repositories';
import { calculateConfidence, calculateTaste, tasteEvidence } from '@/services/engine';
import { matchScore } from '@/services/discovery';

export default function Home() {
  const { colors } = useTheme();
  const [why, setWhy] = useState(false);
  const [campusSheet, setCampusSheet] = useState(false);
  const [travelDraft, setTravelDraft] = useState('Chicago');
  const moves = useAppStore(state => state.moves);
  const campus = useAppStore(state => state.campus);
  const setCampus = useAppStore(state => state.setCampus);
  const travelCity = useAppStore(state => state.travelCity);
  const setTravelCity = useAppStore(state => state.setTravelCity);
  const saved = useAppStore(state => state.savedIds);
  const toggleSave = useAppStore(state => state.toggleSave);
  const friday = useAppStore(state => state.fridayMode);
  const showToast = useUIStore(state => state.showToast);
  const all = catalog.activities();
  const activity = catalog.activity(travelCity ? 'chicago' : 'bouldering')!;
  const taste = calculateTaste(moves, all);
  const confidence = calculateConfidence(moves.filter(move => move.rank !== undefined).length);
  const evidence = tasteEvidence(moves, all);
  const latest = moves.find(move => move.id.startsWith('move-')) ?? moves[0];
  const photoQueue = moves.filter(move => move.userId === 'shawn' && move.photo && !move.ratings);

  return <Screen>
    <View style={styles.topBar}>
      <Brand size={34} />
      <IconButton name="bell" label="Notifications" onPress={() => router.push('/notifications')} />
    </View>

    <View style={styles.intro}>
      <Pressable accessibilityRole="button" accessibilityLabel="Change home or travel city" onPress={() => setCampusSheet(true)} style={styles.location}>
        <Feather name={travelCity ? 'navigation' : 'map-pin'} size={14} color={colors.accentPressed} />
        <T variant="caption" color={colors.accentPressed} style={styles.locationText}>{travelCity ? `TRAVELING · ${travelCity.toUpperCase()}` : `${campus.toUpperCase()} · TONIGHT`}</T>
        <Feather name="chevron-down" size={14} color={colors.accentPressed} />
      </Pressable>
      <T variant="display">{travelCity ? `${travelCity}, meet your taste.` : friday ? 'So… what’s the move?' : 'Good evening, Shawn.'}</T>
      <T color={colors.textSecondary}>{travelCity ? 'The city changed. What you like did not.' : friday ? 'Find something everyone will actually want to do.' : 'A few good reasons to leave the group chat.'}</T>
    </View>

    {photoQueue.length > 0 ? <Pressable accessibilityRole="button" accessibilityLabel={`${photoQueue.length} photos ready to rate`} onPress={() => router.push('/queue')} style={[styles.queueStrip, { borderColor: colors.border }]}>
      <View style={styles.queuePhotos}>{photoQueue.slice(0, 3).map((move, index) => <View key={move.id} style={{ position: index ? 'absolute' : 'relative', left: index * 18, zIndex: 3 - index }}><Photo image={move.photo!} style={[styles.queuePhoto, { borderColor: colors.background }]} /></View>)}</View>
      <View style={styles.flex}>
        <T variant="caption" color={colors.accentPressed} style={styles.eyebrow}>HOME QUEUE · {photoQueue.length}</T>
        <T variant="label">Rate the night while it’s fresh</T>
        <T variant="caption" color={colors.textSecondary}>Six taps, then tag the people.</T>
      </View>
      <Feather name="arrow-right" size={20} color={colors.text} />
    </Pressable> : null}

    {friday ? <View style={styles.splitActions}><Button title="With a crew" icon="users" onPress={() => router.navigate('/(tabs)/crews')} style={styles.flex} /><Button title="Just me" variant="secondary" onPress={() => router.navigate('/(tabs)/explore')} style={styles.flex} /></View> : null}

    <View style={styles.heroWrap}>
      <Photo image={activity.image} style={styles.hero}>
        <LinearGradient colors={['rgba(12,16,10,.03)', 'rgba(12,16,10,.08)', 'rgba(12,16,10,.94)']} locations={[0, .42, 1]} style={styles.heroShade}>
          <View style={[styles.heroLabel, { backgroundColor: colors.background }]}><T variant="caption" color={colors.accentPressed} style={styles.eyebrow}>{travelCity ? `${travelCity.toUpperCase()} TASTE MATCH` : 'PICKED FOR YOU'}</T></View>
          <View style={styles.heroCopy}>
            <Pressable accessibilityRole="button" accessibilityLabel={`View ${activity.name}`} onPress={() => router.push(`/activity/${activity.id}`)}>
              <T variant="display" color={colors.white}>{activity.name}</T>
              <T color={colors.white}>{travelCity ? `${travelCity} · a first-day fit` : activity.placeName}</T>
            </Pressable>
            <View style={styles.match}><View style={[styles.matchDot, { backgroundColor: colors.lime }]} /><T variant="label" color={colors.lime}>{matchScore(taste, activity)}% your kind of move</T></View>
            <T variant="small" color={colors.white}>A little challenge. A good crew. Your kind of night.</T>
            <View style={styles.heroActions}>
              <Pressable accessibilityRole="button" accessibilityLabel={saved.includes(activity.id) ? `Unsave ${activity.name}` : `Save ${activity.name}`} onPress={() => { toggleSave(activity.id); showToast(saved.includes(activity.id) ? 'Removed from Want to Try' : 'Saved to Want to Try'); }} style={[styles.heroButton, { backgroundColor: colors.background }]}><Feather name={saved.includes(activity.id) ? 'check' : 'bookmark'} size={16} color={colors.text} /><T variant="label">{saved.includes(activity.id) ? 'Saved' : 'Save'}</T></Pressable>
              <Pressable accessibilityRole="button" onPress={() => setWhy(true)} style={styles.heroGhost}><T variant="label" color={colors.white}>Why this?</T></Pressable>
            </View>
          </View>
        </LinearGradient>
      </Photo>
    </View>

    <View style={styles.section}>
      <Section title="Tonight with your people" action="Plan one" onAction={() => router.push('/crew/boys/recommend')} />
      <Pressable accessibilityRole="button" accessibilityLabel="Plan Friday after dark with The Boys" onPress={() => router.push('/crew/boys/recommend')} style={[styles.eventRow, { borderColor: colors.border }]}>
        <Photo image="concert" style={styles.eventImage}><View style={[styles.dateBadge, { backgroundColor: colors.accent }]}><T variant="caption" color={colors.white} style={styles.eyebrow}>FRI 8:30</T></View></Photo>
        <View style={styles.eventCopy}>
          <T variant="heading">Friday after dark</T>
          <T variant="small" color={colors.textSecondary}>The Boys · 3 interested</T>
          <AvatarStack ids={['shawn', 'alex', 'ryan', 'noah']} size={27} />
          <T variant="caption" color={colors.accentPressed} style={styles.strong}>VOTE, THEN LOCK IT IN →</T>
        </View>
      </Pressable>
    </View>

    <View style={styles.section}>
      <Section title="From your people" action="See all" onAction={() => router.push('/profile/maya')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.peopleRail}>{['maya', 'alex', 'ryan', 'noah'].map(id => <Pressable key={id} accessibilityRole="button" accessibilityLabel={'View ' + catalog.user(id)?.displayName} onPress={() => router.push({ pathname: '/profile/[username]', params: { username: catalog.user(id)?.username ?? id } })} style={styles.person}><Avatar userId={id} size={50} /><T variant="caption" color={colors.textSecondary}>{catalog.user(id)?.displayName.split(' ')[0]}</T></Pressable>)}</ScrollView>
      <Pressable accessibilityRole="button" accessibilityLabel="Maya's number one Active move" onPress={() => router.push('/profile/maya')} style={[styles.friendUpdate, { borderColor: colors.border }]}>
        <Avatar userId="maya" size={40} />
        <View style={styles.flex}><T variant="caption" color={colors.textSecondary}>Maya found a new favorite</T><T variant="label">Bouldering · <T variant="caption" color={colors.accentPressed}>#1 Active</T></T></View>
        <Feather name="chevron-right" size={18} color={colors.muted} />
      </Pressable>
    </View>

    <View style={styles.section}>
      <Section title={travelCity ? `Your energy in ${travelCity}` : `Around ${campus}`} action="Explore" onAction={() => router.navigate('/(tabs)/explore')} />
      <View style={styles.cardRow}>{(travelCity ? ['thrift', 'jazz'] : ['shawarma', 'picnic']).map(id => { const item = catalog.activity(id)!; return <ActivityCard key={id} activity={item} compact match={matchScore(taste, item)} subtitle={travelCity ? `${travelCity} · picked for you` : undefined} meta={travelCity ? 'Nearby now' : undefined} />; })}</View>
    </View>

    <Pressable accessibilityRole="button" accessibilityLabel="See your Tasteprint" onPress={() => router.push('/taste')} style={[styles.tasteBand, { backgroundColor: colors.ink }]}>
      <View style={styles.flex}><T variant="caption" color={colors.lime} style={styles.eyebrow}>YOUR TASTEPRINT · {confidence}%</T><T variant="heading" color={colors.white}>Your life is getting a shape.</T><T variant="small" color={colors.white}>Every ranked Move makes the next pick sharper.</T></View>
      <TasteprintShape vector={taste} size={104} />
    </Pressable>

    {latest ? <View style={styles.section}><Section title="Your latest Move" /><ActivityRow activity={catalog.activity(latest.activityId)!} subtitle={latest.rank ? `#${latest.rank} in ${latest.category} · View your memory` : 'Ready when you are. Give it a rank.'} onPress={() => router.push({ pathname: '/move/[id]', params: { id: latest.id } })} /></View> : null}

    <View style={styles.signoff}><AvatarStack ids={['shawn', 'alex', 'ryan', 'noah']} size={26} /><T variant="caption" color={colors.muted}>Real life hits different together.</T></View>

    <Sheet visible={why} onClose={() => setWhy(false)} title={`Why ${activity.name}?`}><TasteprintShape vector={taste} size={160} /><T>{travelCity ? `It carries your usual mix of novelty, movement, and social energy into ${travelCity}.` : 'It brings together movement, a little novelty, and time with your people.'}</T>{evidence.slice(0, 2).map(item => <View key={item.axis} style={styles.reason}><Feather name="check-circle" size={18} color={colors.success} /><T variant="small" style={styles.flex}>{item.message}</T></View>)}<T variant="caption" color={colors.textSecondary}>Your match is based on your ranked Moves. Your taste will keep changing.</T><Button title="Take a closer look" onPress={() => { setWhy(false); router.push(`/activity/${activity.id}`); }} /></Sheet>
    <Sheet visible={campusSheet} onClose={() => setCampusSheet(false)} title="Where are you moving through?"><T color={colors.textSecondary}>Use home mode for everyday picks or tell WTM where you landed. Your ranked taste stays the same.</T><Chip label="Home · UIUC" selected={!travelCity} icon="home" onPress={() => { setCampus('UIUC'); setTravelCity(null); setCampusSheet(false); }} /><View style={styles.travelForm}><T variant="label">I’m in a new city</T><Field value={travelDraft} onChangeText={setTravelDraft} placeholder="City" accessibilityLabel="Travel city" /><View style={styles.cityChips}>{['Chicago', 'New York', 'Austin'].map(city => <Chip key={city} label={city} selected={travelDraft === city} onPress={() => setTravelDraft(city)} />)}</View><Button title="Use travel mode" icon="navigation" disabled={!travelDraft.trim()} onPress={() => { setTravelCity(travelDraft); setCampusSheet(false); showToast(`Finding your kind of places in ${travelDraft}.`); }} /></View><Button title="Explore all moves" variant="secondary" onPress={() => { setCampusSheet(false); router.navigate('/(tabs)/explore'); }} /></Sheet>
  </Screen>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, intro: { gap: 7 }, location: { alignSelf: 'flex-start', minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 6 }, locationText: { fontWeight: '800', letterSpacing: .8 }, eyebrow: { fontWeight: '800', letterSpacing: .7 }, strong: { fontWeight: '800' },
  queueStrip: { minHeight: 86, borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 13 }, queuePhotos: { width: 76, flexDirection: 'row' }, queuePhoto: { width: 43, height: 58, borderRadius: 8, borderWidth: 2 },
  splitActions: { flexDirection: 'row', gap: 10 }, heroWrap: { marginHorizontal: -4 }, hero: { height: 366, borderRadius: 18 }, heroShade: { flex: 1, padding: 16, justifyContent: 'space-between' }, heroLabel: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 6 }, heroCopy: { gap: 8 }, match: { flexDirection: 'row', gap: 7, alignItems: 'center' }, matchDot: { width: 7, height: 7, borderRadius: 4 }, heroActions: { flexDirection: 'row', gap: 9, marginTop: 7 }, heroButton: { flex: 1, minHeight: 44, borderRadius: 10, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' }, heroGhost: { flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.18)', alignItems: 'center', justifyContent: 'center' },
  section: { gap: 13 }, eventRow: { flexDirection: 'row', gap: 14, borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 14 }, eventImage: { width: 126, height: 132, borderRadius: 10 }, dateBadge: { position: 'absolute', left: 8, bottom: 8, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 }, eventCopy: { flex: 1, justifyContent: 'space-between', paddingVertical: 2 },
  peopleRail: { gap: 20 }, person: { alignItems: 'center', gap: 5 }, friendUpdate: { minHeight: 68, borderBottomWidth: 1, paddingVertical: 10, flexDirection: 'row', gap: 11, alignItems: 'center' }, cardRow: { flexDirection: 'row', gap: 12 },
  tasteBand: { minHeight: 138, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }, signoff: { alignItems: 'center', gap: 6, paddingTop: 2 }, reason: { flexDirection: 'row', gap: 10 }, travelForm: { gap: 10 }, cityChips: { flexDirection: 'row', gap: 8 },
});
