import React,{useState} from 'react';
import {View,Share,Pressable} from 'react-native';
import {useLocalSearchParams,router} from 'expo-router';
import {Feather} from '@expo/vector-icons';
import {Screen,Header,T,Photo,Button,Section,AvatarStack,Sheet,Field,Empty} from '@/components/ui';
import {useTheme} from '@/theme';
import {useAppStore} from '@/stores/app';
import {useUIStore} from '@/stores/ui';
import {catalog} from '@/repositories';
import {friendMoves,currentUserId,users} from '@/data/seed';
import {calculateTaste} from '@/services/engine';
import {TasteprintShape} from '@/components/TasteprintShape';

export default function MoveDetail(){
 const{id}=useLocalSearchParams<{id:string}>();const state=useAppStore();const {colors}=useTheme();const toast=useUIStore(s=>s.showToast);const [editing,setEditing]=useState(false);const [note,setNote]=useState('');
 const move=state.moves.find(m=>m.id===id)??friendMoves.find(m=>m.id===id);const activity=move?catalog.activity(move.activityId):undefined;
 if(!move||!activity)return <Screen><Header back/><Empty title="Couldn’t load this Move." body="Try again in a second." action="Go back" onAction={()=>router.back()}/></Screen>;
 const own=move.userId===currentUserId;const user=users.find(u=>u.id===move.userId);const taste=calculateTaste(state.moves,catalog.activities());const participantIds=[move.userId,...move.confirmedParticipantIds];const alreadyConfirmed=state.moves.some(m=>m.sourceMoveId===move.id);
 const confirm=()=>{if(alreadyConfirmed)return;state.logMove({activityId:move.activityId,category:move.category,placeName:move.placeName,date:move.date,note:move.note,photo:move.photo,participantIds:move.participantIds.filter(p=>p!==currentUserId),confirmedParticipantIds:[],visibility:state.defaultVisibility,locationVisibility:move.locationVisibility,sourceMoveId:move.id});toast('Added to your Moves.');};
 return <Screen><Header back title={own?'Your Move':(user?.displayName.split(' ')[0]??'A friend')+'’s Move'} right={<Pressable accessibilityRole="button" onPress={()=>void Share.share({message:activity.name+(activity.placeName?' at '+activity.placeName:'')+' · A Move on WTM'}).catch(()=>toast('Sharing is unavailable here.'))} style={{minHeight:44,justifyContent:'center'}}><Feather name="share-2" size={20} color={colors.text}/></Pressable>}/>
  <Photo image={activity.image} style={{height:260}}/>
  <View style={{gap:8}}><T variant="display">{activity.name}</T><T variant="body" color={colors.textSecondary}>{move.placeName??'No place needed'} · {new Date(move.date).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</T>{move.rank&&<View style={{alignSelf:'flex-start',backgroundColor:colors.accentSoft,paddingHorizontal:13,paddingVertical:8,borderRadius:13}}><T variant="label" color={colors.accentPressed}>#{move.rank} in {activity.category}</T></View>}</View>
  {move.note&&<View style={{backgroundColor:colors.surface,padding:18,borderRadius:20,gap:5}}><T variant="caption" color={colors.textSecondary}>Worth remembering</T><T variant="body">“{move.note}”</T></View>}
  <Section title="Who was there?"/><View style={{flexDirection:'row',alignItems:'center',gap:10}}><AvatarStack ids={participantIds} size={38}/><T variant="small" color={colors.textSecondary}>{participantIds.map(p=>users.find(u=>u.id===p)?.displayName.split(' ')[0]??'You').join(' · ')}</T></View>
  <View style={{backgroundColor:colors.surfaceAlt,borderRadius:22,padding:18,flexDirection:'row',alignItems:'center',gap:10}}><TasteprintShape vector={taste} size={110}/><View style={{flex:1,gap:6}}><T variant="label">A Move that shaped your taste</T><T variant="small" color={colors.textSecondary}>This experience adds context to your personal Tasteprint.</T></View></View>
  {!own&&<View style={{gap:10}}>{alreadyConfirmed?<T variant="small" color={colors.success}>You’ve confirmed this tag. It’s in your personal history.</T>:<><T variant="small" color={colors.textSecondary}>{user?.displayName.split(' ')[0]??'Your friend'} tagged you. Confirm before it enters your history.</T><Button title="Confirm and add to my Moves" onPress={confirm}/></>}</View>}
  {own&&<View style={{gap:10}}><Button title="Edit memory" variant="secondary" onPress={()=>{setNote(move.note??'');setEditing(true)}}/><Button title="Re-rank this Move" variant="ghost" onPress={()=>router.push({pathname:'/rank/[moveId]',params:{moveId:move.id}})}/></View>}
  <Sheet visible={editing} onClose={()=>setEditing(false)} title="Edit your memory"><Field value={note} onChangeText={setNote} placeholder="A little note, if you want one" maxLength={180} multiline/><Button title="Save note" onPress={()=>{state.updateMove(move.id,{note:note.trim()||undefined});setEditing(false);toast('Memory updated.')}}/></Sheet>
 </Screen>;
}
