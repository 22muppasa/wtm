import React,{useMemo,useState} from 'react';
import {View,ScrollView,Pressable} from 'react-native';
import {router} from 'expo-router';
import {Feather} from '@expo/vector-icons';
import {Screen,T,Section,Field,Chip,IconButton,Sheet,Button,ActivityCard,Avatar,Empty} from '@/components/ui';
import {useTheme} from '@/theme';
import {useAppStore} from '@/stores/app';
import {catalog} from '@/repositories';
import {calculateTaste} from '@/services/engine';
import {matchScore} from '@/services/discovery';

const filters=['Tonight','Active','Food','Chill','Outside','Free','Events'];
export default function Explore(){
 const{colors}=useTheme();
 const[query,setQuery]=useState(''),[filter,setFilter]=useState('Tonight'),[budget,setBudget]=useState(3),[distance,setDistance]=useState(999),[sheet,setSheet]=useState(false);
 const moves=useAppStore(s=>s.moves),travelCity=useAppStore(s=>s.travelCity),setTravelCity=useAppStore(s=>s.setTravelCity),taste=calculateTaste(moves,catalog.activities());
 const searching=query.trim().length>0;
 const search=useMemo(()=>catalog.search(query),[query]);
 const list=(searching?search.activities:catalog.activities()).filter(a=>(filter==='Tonight'||filter==='Free'&&a.price===0||filter==='Outside'&&a.category==='outdoors'||a.category===filter.toLowerCase())&&a.price<=budget&&a.distance<=distance);
 const sections=travelCity&&filter==='Tonight'&&!searching?[
  {title:`Made for your first ${travelCity} night`,sub:'Your taste, translated to a new city.',ids:['chicago','thrift']},
  {title:'Follow the interesting people',sub:'Social enough to meet somebody. Niche enough to remember.',ids:['jazz','ceramics']},
  {title:'Keep it spontaneous',sub:'Low planning, high chance of a story.',ids:['market','late-food']}
 ]:filter==='Tonight'&&!searching?[
  {title:'For you',sub:'A few things that feel like you.',ids:['shawarma','illini']},
  {title:'Under the radar',sub:'Good things, just off your usual route.',ids:['picnic','krannert']},
  {title:'A little outside your usual',sub:'Make room for a new favorite.',ids:['ceramics','jazz']},
  {title:'Free feels good',sub:'A great night doesn’t need a big budget.',ids:['walk','boardgames']}
 ]:[{title:searching?'Activities':filter+' moves',sub:searching?list.length+' things to try':'Find your next favorite.',ids:list.map(a=>a.id)}];
 return <Screen>
  <View style={{gap:7}}><T variant="title">{travelCity?`Find your ${travelCity}.`:'Find your next favorite.'}</T><T color={colors.textSecondary}>{travelCity?'WTM uses the taste you already built to cut through a new city.':'Good things are closer than you think.'}</T></View>
  {travelCity&&<View style={{backgroundColor:colors.ink,borderRadius:20,padding:17,flexDirection:'row',alignItems:'center',gap:13}}><Feather name="navigation" size={22} color={colors.accent}/><View style={{flex:1}}><T variant="label" color="#fff">Travel mode · {travelCity}</T><T variant="caption" color="#fff">Familiar taste. Fresh map.</T></View><Pressable accessibilityRole="button" onPress={()=>setTravelCity(null)} style={{minHeight:44,justifyContent:'center'}}><T variant="small" color={colors.accent}>Go home</T></Pressable></View>}
  <View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={{flex:1}}><Field value={query} onChangeText={setQuery} placeholder="What do you feel like doing?" returnKeyType="search"/></View><IconButton name="sliders" label="Filter activities" onPress={()=>setSheet(true)}/></View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>{filters.map(f=><Chip key={f} label={f} selected={filter===f} onPress={()=>setFilter(f)}/>)}</ScrollView>
  {(budget<3||distance<999)&&<Pressable accessibilityRole="button" onPress={()=>{setBudget(3);setDistance(999);}}><T variant="small" color={colors.accentPressed}>Filters applied · Clear all</T></Pressable>}
  {sections.map(section=>{const items=section.ids.map(id=>list.find(a=>a.id===id)).filter(a=>a!==undefined);if(!items.length)return null;return <View key={section.title} style={{gap:15}}><View style={{gap:4}}><Section title={section.title}/><T variant="small" color={colors.textSecondary}>{section.sub}</T></View>{Array.from({length:Math.ceil(items.length/2)},(_,i)=><View key={i} style={{flexDirection:'row',gap:14}}>{items.slice(i*2,i*2+2).map(a=><ActivityCard key={a.id} activity={a} compact match={matchScore(taste,a)} subtitle={travelCity?`${travelCity} · matched to your taste`:undefined} meta={travelCity?`${a.price===0?'Free':'$'.repeat(a.price)} · nearby`:undefined}/>)}{items.slice(i*2,i*2+2).length===1&&<View style={{flex:1}}/>}</View>)}</View>;})}
  {!list.length&&<Empty title="A different kind of move?" body="Try another search or loosen a filter." action="Clear search & filters" onAction={()=>{setQuery('');setFilter('Tonight');setBudget(3);setDistance(999);}}/>}
  {searching&&search.users.length>0&&<View style={{gap:12}}><Section title="People"/>{search.users.map(u=><Pressable key={u.id} accessibilityRole="button" onPress={()=>router.push({pathname:'/profile/[username]',params:{username:u.username}})} style={{flexDirection:'row',alignItems:'center',gap:12,padding:12,backgroundColor:colors.surface,borderRadius:16}}><Avatar userId={u.id}/><View style={{flex:1}}><T variant="label">{u.displayName}</T><T variant="caption" color={colors.textSecondary}>@{u.username} · {u.campus}</T></View><Feather name="chevron-right" size={18} color={colors.muted}/></Pressable>)}</View>}
  {searching&&search.places.length>0&&<View style={{gap:12}}><Section title="Places"/>{search.places.map(p=><Button key={p.id} title={p.name} icon="map-pin" variant="secondary" onPress={()=>router.push({pathname:'/place/[id]',params:{id:p.id}})}/>)}</View>}
  {searching&&search.lists.length>0&&<View style={{gap:12}}><Section title="Lists"/>{search.lists.map(l=><Button key={l.id} title={l.title} variant="secondary" onPress={()=>router.push({pathname:'/list/[id]',params:{id:l.id}})}/>)}</View>}
  {!travelCity&&<View style={{gap:12}}><Section title="Worth leaving campus for"/><Pressable accessibilityRole="button" onPress={()=>router.push('/list/maya-uiuc')} style={{backgroundColor:colors.surfaceAlt,padding:20,borderRadius:22,gap:12}}><View style={{flexDirection:'row',alignItems:'center',gap:9}}><Avatar userId="maya" size={32}/><T variant="caption" color={colors.textSecondary}>A list by Maya Chen</T></View><T variant="heading">5 UIUC Moves worth leaving campus for</T><T variant="small" color={colors.accentPressed}>Borrow a little of her good taste ↗</T></Pressable></View>}
  <Sheet visible={sheet} onClose={()=>setSheet(false)} title="Make it your kind of night"><T variant="label">Budget</T><View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>{['Free','$','$$','Any'].map((b,i)=><Chip key={b} label={b} selected={budget===i} onPress={()=>setBudget(i)}/>)}</View><T variant="label">How far?</T><View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>{[{v:10,l:'Campus'},{v:20,l:'Nearby'},{v:999,l:'Anywhere'}].map(d=><Chip key={d.l} label={d.l} selected={distance===d.v} onPress={()=>setDistance(d.v)}/>)}</View><Button title="Show my moves" onPress={()=>setSheet(false)}/></Sheet>
 </Screen>;
}
