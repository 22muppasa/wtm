import React,{useEffect,useState} from 'react';
import {View,Platform,StyleSheet,Pressable} from 'react-native';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useAppStore} from '@/stores/app';
import {useUIStore} from '@/stores/ui';
import {useTheme} from '@/theme';
import {CubeMark,T} from '@/components/ui';
import Animated,{Easing,useAnimatedStyle,useReducedMotion,useSharedValue,withRepeat,withTiming} from 'react-native-reanimated';

export {ErrorBoundary} from 'expo-router';
function BootScreen(){const{colors}=useTheme();const reduced=useReducedMotion();const turn=useSharedValue(0);useEffect(()=>{if(!reduced)turn.value=withRepeat(withTiming(360,{duration:1150,easing:Easing.inOut(Easing.cubic)}),-1,false);},[reduced,turn]);const cubeStyle=useAnimatedStyle(()=>({transform:[{rotate:`${turn.value}deg`},{scale:1+.04*Math.sin(turn.value*Math.PI/180)}]}));return <View style={{flex:1,alignItems:'center',justifyContent:'center',gap:26,backgroundColor:colors.background}}><Animated.View style={cubeStyle}><CubeMark size={116}/></Animated.View><View style={{alignItems:'center',gap:7}}><T variant="title">WTM</T><T color={colors.textSecondary}>Getting your world ready…</T></View></View>;}
function Navigation(){const{colors}=useTheme();const hydrated=useAppStore(s=>s.hydrated);const toast=useUIStore(s=>s.toast);const clearToast=useUIStore(s=>s.clearToast);const reduced=useReducedMotion();const[bootReady,setBootReady]=useState(false);useEffect(()=>{const id=setTimeout(()=>setBootReady(true),850);return()=>clearTimeout(id);},[]);useEffect(()=>{if(!toast)return;const id=setTimeout(clearToast,3500);return()=>clearTimeout(id);},[toast,clearToast]);const ready=hydrated&&bootReady;return <View style={{flex:1,backgroundColor:colors.background,width:'100%',maxWidth:Platform.OS==='web'?520:undefined,alignSelf:'center',overflow:'hidden'}}><StatusBar style={colors.background==='#171614'?'light':'dark'}/>{ready?<Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:colors.background},animation:reduced?'fade':'slide_from_right'}}><Stack.Screen name="(tabs)" options={{animation:'fade'}}/><Stack.Screen name="log" options={{presentation:'fullScreenModal',animation:reduced?'fade':'slide_from_bottom'}}/><Stack.Screen name="camera" options={{presentation:'fullScreenModal',animation:'fade'}}/><Stack.Screen name="queue" options={{presentation:'fullScreenModal',animation:reduced?'fade':'slide_from_bottom'}}/><Stack.Screen name="onboarding" options={{animation:'fade'}}/></Stack>:<BootScreen/>}{toast&&<Pressable accessibilityRole="alert" onPress={clearToast} style={{position:'absolute',left:24,right:24,bottom:104,backgroundColor:colors.text,padding:16,borderRadius:18,boxShadow:'0 8px 24px rgba(0,0,0,.15)'}}><T variant="small" color={colors.background}>{toast}</T></Pressable>}</View>;}
export default function RootLayout(){return <GestureHandlerRootView style={styles.root}><SafeAreaProvider><Navigation/></SafeAreaProvider></GestureHandlerRootView>;}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#EDE9E2'}});
