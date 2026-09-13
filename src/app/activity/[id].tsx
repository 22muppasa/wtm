import React,{useState} from 'react';
import {View,Pressable,Share} from 'react-native';
import {useLocalSearchParams,router} from 'expo-router';
import {Feather} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {Screen,T,Photo,IconButton,Section,Button,Avatar,AvatarStack,Sheet,Empty,ActivityCard} from '@/components/ui';
import {TasteprintShape} from '@/components/TasteprintShape';
import {useTheme} from '@/theme';
import {useAppStore} from '@/stores/app';
import {useUIStore} from '@/stores/ui';
import {catalog} from '@/repositories';
import {calculateTaste} from '@/services/engine';
import {matchScore} from '@/services/discovery';

export default function ActivityDetail(){
 const{id}=useLocalSearchParams<{id:string}>(),activity=catalog.activity(id);
 const{colors}=useTheme(),[chooseCrew,setChooseCrew]=useState(false);
 const moves=useAppStore(s=>s.moves),saved=useAppStore(s=>s.savedIds),toggleSave=useAppStore(s=>s.toggleSave),crews=useAppStore(s=>s.crews),createProposal=useAppStore(s=>s.createProposal);
 const showToast=useUIStore(s=>s.showToast),taste=calculateTaste(moves,catalog.activities());
 if(!activity)return <Screen><Empty title="Couldn't find this Move." body="It may have moved. Explore something else." action="Explore" onAction={()=>router.replace('/(tabs)/explore')}/></Screen>;
 function plan(crewId:string){if(!activity)return;const date=new Date();date.setHours(19,30,0,0);if(date.getTime()<Date.now())date.setDate(date.getDate()+1);const pid=createProposal({crewId,activityId:activity.id,scheduledAt:date.toISOString(),fit:matchScore(taste,activity),reasons:['You picked this Move for your crew.']});setChooseCrew(false);router.push({pathname:'/proposal/[id]',params:{id:pid}});}
 return <Screen padded={false}>
  <View style={{paddingHorizontal:20,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><IconButton name="arrow-left" label="Go back" onPress={()=>router.canGoBack()?router.back():router.replace('/(tabs)/explore')}/><View style={{flexDirection:'row'}}><IconButton name="share-2" label="Share activity" onPress={()=>{void Share.share({message:activity.name+(activity.placeName?' at '+activity.placeName:'')+' — What’s the move?'}).catch(()=>showToast('Sharing is unavailable on this device.'));}}/><IconButton name={saved.includes(id)?'check':'bookmark'} label={saved.includes(id)?'Remove from Want to Try':'Save to Want to Try'} onPress={()=>{toggleSave(id);showToast(saved.includes(id)?'Removed from Want to Try':'Saved to Want to Try');}}/></View></View>
  <Photo image={activity.image} style={{height:330,borderRadius:0}}><LinearGradient colors={['transparent','rgba(14,18,12,.48)']} style={{flex:1,justifyContent:'flex-end',padding:24}}><View style={{alignSelf:'flex-start',backgroundColor:colors.background,paddingHorizontal:12,paddingVertical:7,borderRadius:12}}><T variant="label" color={colors.success}>{matchScore(taste,activity)}% your kind of move</T></View></LinearGradient></Photo>
  <View style={{paddingHorizontal:24,gap:26}}>
   <View style={{gap:7}}><T variant="display">{activity.name}</T><Pressable accessibilityRole="button" onPress={()=>activity.placeId&&router.push({pathname:'/place/[id]',params:{id:activity.placeId}})}><T color={colors.textSecondary}>{activity.placeName??'Make it your own'} {activity.placeId?'↗':''}</T></Pressable><T variant="small" color={colors.textSecondary}>{activity.distance} min away · {activity.price===0?'Free':'$'.repeat(activity.price)} · About {activity.minutes} minutes</T></View>
   <T>{activity.description}</T>
   <View style={{gap:12}}><Section title="Why you’ll probably like it"/><View style={{flexDirection:'row',alignItems:'center',backgroundColor:colors.surfaceAlt,borderRadius:22,padding:16,gap:12}}><TasteprintShape vector={taste} size={95}/><View style={{flex:1,gap:5}}><T variant="label">A little of what you love.</T><T variant="small" color={colors.textSecondary}>This matches the experiences you’ve ranked, with room for something new.</T></View></View></View>
   <View style={{gap:12}}><Section title="Better with your people"/><Pressable accessibilityRole="button" onPress={()=>router.push('/profile/maya')} style={{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:8}}><Avatar userId="maya"/><View style={{flex:1}}><T variant="label">Maya Chen</T><T variant="small" color={colors.textSecondary}>{activity.id==='bouldering'?'Ranked Bouldering #1 in Active':'Discover Maya’s favorites around campus'}</T></View><Feather name="chevron-right" size={18} color={colors.muted}/></Pressable></View>
   <Button title="Make this the move" icon="arrow-up-right" onPress={()=>setChooseCrew(true)}/>
   <Button title="Already did it? Log it" variant="secondary" onPress={()=>router.push({pathname:'/log',params:{activityId:id}})}/>
   <T variant="caption" color={colors.muted}>Demo activity details and illustrative photography. Check the venue for current hours and pricing.</T>
   <View style={{gap:14}}><Section title="Keep exploring"/><View style={{flexDirection:'row',gap:14}}>{catalog.activities().filter(a=>a.id!==id&&a.category===activity.category).slice(0,2).map(a=><ActivityCard key={a.id} activity={a} compact/>)}</View></View>
  </View>
  <Sheet visible={chooseCrew} onClose={()=>setChooseCrew(false)} title="Who’s making the move?">{crews.map(c=><Pressable key={c.id} accessibilityRole="button" onPress={()=>plan(c.id)} style={{flexDirection:'row',alignItems:'center',gap:12,padding:14,backgroundColor:colors.surface,borderRadius:18}}><AvatarStack ids={c.memberIds} size={28}/><T variant="label" style={{flex:1}}>{c.name}</T><Feather name="chevron-right" size={18} color={colors.textSecondary}/></Pressable>)}<Button title={saved.includes(id)?'Saved for a solo adventure':'Save for a solo adventure'} variant="secondary" onPress={()=>{if(!saved.includes(id))toggleSave(id);setChooseCrew(false);showToast('Ready in your Want to Try collection');}}/></Sheet>
 </Screen>;
}
