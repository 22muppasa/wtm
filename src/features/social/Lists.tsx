import React from 'react';
import { View, Share, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Header, T, Photo, Avatar, Button, Section, ActivityRow, Empty, IconButton } from '@/components/ui';
import { useAppStore } from '@/stores/app';
import { useUIStore } from '@/stores/ui';
import { useTheme } from '@/theme';
import { publicLists, users } from '@/data/seed';
import { s, activityOf, Panel } from './shared';

export function ListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { savedIds, savedListIds, followingIds, moves, toggleSave, toggleSaveList, toggleFollow } = useAppStore();
  const toast = useUIStore(s => s.showToast);
  const { colors } = useTheme();
  const wanted = id === 'want-to-try' || id === 'saved';
  const list = publicLists.find(item => item.id === id);
  const author = users.find(user => user.id === list?.userId);
  if (!wanted && !list) return <Screen><Header back /><Empty title="That list isn't here." body="Your saved ideas are still waiting for you." action="Want to try" onAction={() => router.replace('/list/want-to-try')} /></Screen>;
  const selection = (wanted ? savedIds : list!.activityIds).map(activityOf).filter((activity): activity is NonNullable<typeof activity> => !!activity);
  const share = async () => { try { await Share.share({ title: list?.title ?? 'My Want to Try list', message: `${list?.title ?? 'My Want to Try list'}\n\n${selection.map((activity, index) => `${index + 1}. ${activity.name}${activity.placeName ? ` — ${activity.placeName}` : ''}`).join('\n')}\n\nFind your next move with WTM.` }); } catch { toast('Sharing is unavailable here. Your list is still saved.'); } };
  return <Screen><Header back right={selection.length ? <IconButton name="share" label="Share list" onPress={() => void share()} /> : undefined} />
    {wanted ? <><T variant="display">Want to try.</T><T variant="body">Good ideas. Kept close.</T><T variant="small">{selection.length} possibilities for your next free moment.</T></> : <><View style={s.row}><Avatar userId={author?.id} size={42} /><View><T variant="label">A list by {author?.displayName.split(' ')[0]}</T><T variant="caption">{list!.subtitle}</T></View></View><T variant="display">{list!.title}</T><View style={s.row}><Button title={savedListIds.includes(list!.id) ? 'List saved' : 'Save list'} icon={savedListIds.includes(list!.id) ? 'check' : 'bookmark'} onPress={() => toggleSaveList(list!.id)} style={s.flex} />{author && <Button title={followingIds.includes(author.id) ? 'Following' : `Follow ${author.displayName.split(' ')[0]}`} variant="secondary" onPress={() => toggleFollow(author.id)} style={s.flex} />}</View></>}
    {!selection.length && <Empty title="A little room for possibility." body="Save moves that catch your eye. They will be waiting right here." action="Find something good" onAction={() => router.push('/(tabs)/explore')} />}
    <View style={{ gap: 28 }}>{selection.map((activity, index) => {
      const done = moves.find(m => m.activityId === activity.id);
      return wanted ? <Panel key={activity.id}><ActivityRow activity={activity} onPress={() => router.push(`/activity/${activity.id}`)} right={<IconButton name="bookmark" label={`Remove ${activity.name} from saved`} onPress={() => toggleSave(activity.id)} />} />{done ? <Button title={done.rank ? 'You finally did it · view move' : 'You finally did it · rank it'} variant="ghost" onPress={() => router.push(done.rank ? `/move/${done.id}` : `/rank/${done.id}`)} /> : <Button title="Make this your next move" variant="ghost" onPress={() => router.push(`/activity/${activity.id}`)} />}</Panel> : <View key={activity.id} style={s.gap}><View style={s.row}><T variant="title" color={colors.accent}>{String(index + 1).padStart(2, '0')}</T><View style={s.flex}><T variant="heading">{activity.name}</T><T variant="small">{activity.placeName}</T></View></View><Photo image={activity.image} style={styles.photo} /><T variant="body">{activity.description}</T><View style={s.row}><Button title="View move" variant="secondary" onPress={() => router.push(`/activity/${activity.id}`)} style={s.flex} /><Button title={savedIds.includes(activity.id) ? 'Saved' : 'Steal this move'} variant="ghost" icon={savedIds.includes(activity.id) ? 'check' : 'bookmark'} onPress={() => { toggleSave(activity.id); if (!savedIds.includes(activity.id)) toast('Added to Want to Try. Make it your own.'); }} style={s.flex} /></View></View>;
    })}</View>
    {wanted && savedListIds.length > 0 && <><Section title="Lists you kept" />{savedListIds.map(listId => publicLists.find(item => item.id === listId)).filter(item => !!item).map(item => <Button key={item.id} title={item.title} variant="secondary" onPress={() => router.push(`/list/${item.id}`)} />)}</>}
  </Screen>;
}
const styles = StyleSheet.create({ photo: { height: 220, borderRadius: 24 } });
