import React,{useState} from 'react';
import {View,Pressable,ScrollView} from 'react-native';
import {router} from 'expo-router';
import {Feather} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {Screen,T,Avatar,AvatarStack,IconButton,Section,Photo,Button,Sheet,Chip,ActivityCard,ActivityRow} from '@/components/ui';
import {TasteprintShape} from '@/components/TasteprintShape';
import {useTheme} from '@/theme';
import {useAppStore} from '@/stores/app';
import {useUIStore} from '@/stores/ui';
import {catalog} from '@/repositories';
import {calculateTaste,calculateConfidence,tasteEvidence} from '@/services/engine';
import {matchScore} from '@/services/discovery';

export default function Home(){
 const{colors}=useTheme();
 const[why,setWhy]=useState(false),[campusSheet,setCampusSheet]=useState(false);
 const moves=useAppStore(s=>s.moves),campus=useAppStore(s=>s.campus),setCampus=useAppStore(s=>s.setCampus),saved=useAppStore(s=>s.savedIds),toggleSave=useAppStore(s=>s.toggleSave),friday=useAppStore(s=>s.fridayMode);
 const showToast=useUIStore(s=>s.showToast);
 const all=catalog.activities(),activity=catalog.activity('bouldering')!,taste=calculateTaste(moves,all),confidence=calculateConfidence(moves.filter(m=>m.rank!==undefined).length),evidence=tasteEvidence(moves,all);
 const latest=moves.find(m=>m.id.startsWith('move-'))??moves[0];
 return <Screen>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Choose campus" onPress={()=>setCampusSheet(true)} style={{flexDirection:'row',gap:10,alignItems:'center',minHeight:44}}><Avatar size={42}/><T variant="label">{campus}</T><Feather name="chevron-down" size={14} color={colors.textSecondary}/></Pressable>
   <IconButton name="bell" label="Notifications" onPress={()=>router.push('/notifications')}/>
  </View>
  <View style={{gap:7}}><T variant="title">{friday?'So… what’s the move?':'Good evening, Shawn'}</T><T color={colors.textSecondary}>{friday?'Find something everyone will actually want to do.':'Here’s what’s worth doing tonight.'}</T></View>
  {friday&&<View style={{flexDirection:'row',gap:10}}><Button title="With a crew" icon="users" onPress={()=>router.navigate('/(tabs)/crews')} style={{flex:1}}/><Button title="Just me" variant="secondary" onPress={()=>router.navigate('/(tabs)/explore')} style={{flex:1}}/></View>}
  <Photo image={activity.image} style={{height:352,borderRadius:26}}>
   <LinearGradient colors={['rgba(12,16,10,0.05)','rgba(12,16,10,0.03)','rgba(12,16,10,0.93)']} locations={[0,.35,1]} style={{flex:1,padding:20,justifyContent:'space-between'}}>
    <View style={{alignSelf:'flex-start',backgroundColor:colors.background,paddingHorizontal:12,paddingVertical:7,borderRadius:12,flexDirection:'row',gap:7,alignItems:'center'}}><Feather name="compass" size={14} color={colors.accentPressed}/><T variant="caption" style={{fontWeight:'600'}} color={colors.ink}>Picked for you</T></View>
    <View style={{gap:7}}>
     <Pressable accessibilityRole="button" accessibilityLabel="View Bouldering" onPress={()=>router.push('/activity/bouldering')}><T variant="title" color={colors.white}>Bouldering</T><T color={colors.white}>Urbana Boulders</T></Pressable>
     <View style={{flexDirection:'row',gap:6,alignItems:'center'}}><Feather name="check-circle" size={15} color="#D3E7A0"/><T variant="label" color="#D3E7A0">{matchScore(taste,activity)}% your kind of move</T></View>
     <T variant="small" color={colors.white}>A little challenge. A good crew. Your kind of night.</T>
     <View style={{flexDirection:'row',gap:10,marginTop:7}}>
      <Pressable accessibilityRole="button" accessibilityLabel={saved.includes(activity.id)?'Unsave Bouldering':'Save Bouldering'} onPress={()=>{toggleSave(activity.id);showToast(saved.includes(activity.id)?'Removed from Want to Try':'Saved to Want to Try');}} style={{minHeight:43,borderRadius:13,backgroundColor:colors.background,flex:1,flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center'}}><Feather name={saved.includes(activity.id)?'check':'bookmark'} size={16} color={colors.ink}/><T variant="label" color={colors.ink}>{saved.includes(activity.id)?'Saved':'Save'}</T></Pressable>
      <Pressable accessibilityRole="button" onPress={()=>setWhy(true)} style={{minHeight:43,borderRadius:13,backgroundColor:'rgba(255,255,255,.23)',flex:1,alignItems:'center',justifyContent:'center'}}><T variant="label" color={colors.white}>Why this?</T></Pressable>
     </View>
    </View>
   </LinearGradient>
  </Photo>
  <View style={{gap:12}}>
   <Section title="From your people" action="See all" onAction={()=>router.push('/profile/maya')}/>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:19}}>{['maya','alex','ryan','noah'].map(id=><Pressable key={id} accessibilityRole="button" accessibilityLabel={'View '+catalog.user(id)?.displayName} onPress={()=>router.push({pathname:'/profile/[username]',params:{username:catalog.user(id)?.username??id}})} style={{alignItems:'center',gap:5}}><Avatar userId={id} size={49}/><T variant="caption" color={colors.textSecondary}>{catalog.user(id)?.displayName.split(' ')[0]}</T></Pressable>)}</ScrollView>
   <Pressable accessibilityRole="button" accessibilityLabel="Maya's number one Active move" onPress={()=>router.push('/profile/maya')} style={{backgroundColor:colors.surface,padding:14,borderRadius:18,flexDirection:'row',gap:12,alignItems:'center'}}><Avatar userId="maya" size={38}/><View style={{flex:1,gap:2}}><T variant="caption" color={colors.textSecondary}>Maya found a new favorite</T><T variant="label">Bouldering <T variant="caption" color={colors.success}> · #1 in Active</T></T><T variant="caption" color={colors.muted}>A little outside your usual. In the best way.</T></View><Feather name="chevron-right" size={17} color={colors.textSecondary}/></Pressable>
  </View>
  <View style={{gap:14}}><Section title={'Around '+campus} action="Explore" onAction={()=>router.navigate('/(tabs)/explore')}/><View style={{flexDirection:'row',gap:14}}>{['shawarma','picnic'].map(id=>{const a=catalog.activity(id)!;return <ActivityCard key={id} activity={a} compact match={matchScore(taste,a)}/>;})}</View></View>
  <Pressable accessibilityRole="button" accessibilityLabel="See your Tasteprint" onPress={()=>router.push('/taste')} style={{backgroundColor:colors.surfaceAlt,borderRadius:22,padding:20,flexDirection:'row',alignItems:'center',gap:6}}><View style={{flex:1,gap:6}}><T variant="caption" color={colors.textSecondary} style={{letterSpacing:1}}>YOUR TASTE, TAKING SHAPE</T><T variant="heading">A little more you.</T><T variant="small" color={colors.textSecondary}>{confidence}% calibrated. Every ranked Move tells us more.</T></View><TasteprintShape vector={taste} size={95}/></Pressable>
  {latest&&<View style={{gap:12}}><Section title="Your latest Move"/><ActivityRow activity={catalog.activity(latest.activityId)!} subtitle={latest.rank?'#'+latest.rank+' in '+latest.category+' · View your memory':'Ready when you are. Give it a rank.'} onPress={()=>router.push({pathname:'/move/[id]',params:{id:latest.id}})}/></View>}
  <View style={{alignItems:'center',paddingTop:8,gap:6}}><AvatarStack ids={['shawn','alex','ryan','noah']} size={26}/><T variant="caption" color={colors.muted}>Real life hits different together.</T></View>
  <Sheet visible={why} onClose={()=>setWhy(false)} title="Why Bouldering?"><TasteprintShape vector={taste} size={160}/><T>It brings together movement, a little novelty, and time with your people.</T>{evidence.slice(0,2).map(e=><View key={e.axis} style={{flexDirection:'row',gap:10}}><Feather name="check-circle" size={18} color={colors.success}/><T variant="small" style={{flex:1}}>{e.message}</T></View>)}<T variant="caption" color={colors.textSecondary}>Your match is based on your ranked Moves. Your taste will keep changing.</T><Button title="Take a closer look" onPress={()=>{setWhy(false);router.push('/activity/bouldering');}}/></Sheet>
  <Sheet visible={campusSheet} onClose={()=>setCampusSheet(false)} title="Your corner of the world"><T color={colors.textSecondary}>The demo collection is around Urbana-Champaign.</T><Chip label="UIUC · Urbana-Champaign" selected={campus==='UIUC'} onPress={()=>{setCampus('UIUC');setCampusSheet(false);}}/><Button title="Explore around campus" variant="secondary" onPress={()=>{setCampusSheet(false);router.navigate('/(tabs)/explore');}}/></Sheet>
 </Screen>;
}
