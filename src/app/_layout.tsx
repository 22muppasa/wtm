import React,{useEffect} from 'react';
import {View,Platform,StyleSheet,Pressable} from 'react-native';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useAppStore} from '@/stores/app';
import {useUIStore} from '@/stores/ui';
import {useTheme} from '@/theme';
import {Brand,T} from '@/components/ui';
import {useReducedMotion} from 'react-native-reanimated';

export {ErrorBoundary} from 'expo-router';
function Navigation(){const{colors}=useTheme();const hydrated=useAppStore(s=>s.hydrated);const toast=useUIStore(s=>s.toast);const clearToast=useUIStore(s=>s.clearToast);const reduced=useReducedMotion();useEffect(()=>{if(!toast)return;const id=setTimeout(clearToast,3500);return()=>clearTimeout(id);},[toast,clearToast]);return <View style={{flex:1,backgroundColor:colors.background,width:'100%',maxWidth:Platform.OS==='web'?520:undefined,alignSelf:'center',overflow:'hidden'}}><StatusBar style={colors.background==='#171614'?'light':'dark'}/>{hydrated?<Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:colors.background},animation:reduced?'fade':'slide_from_right'}}><Stack.Screen name="(tabs)" options={{animation:'fade'}}/><Stack.Screen name="log" options={{presentation:'fullScreenModal',animation:reduced?'fade':'slide_from_bottom'}}/><Stack.Screen name="onboarding" options={{animation:'fade'}}/></Stack>:<View style={{flex:1,alignItems:'center',justifyContent:'center',gap:24}}><Brand size={72}/><T>Getting your Moves ready…</T></View>}{toast&&<Pressable accessibilityRole="alert" onPress={clearToast} style={{position:'absolute',left:24,right:24,bottom:104,backgroundColor:colors.text,padding:16,borderRadius:18,boxShadow:'0 8px 24px rgba(0,0,0,.15)'}}><T variant="small" color={colors.background}>{toast}</T></Pressable>}</View>;}
export default function RootLayout(){return <GestureHandlerRootView style={styles.root}><SafeAreaProvider><Navigation/></SafeAreaProvider></GestureHandlerRootView>;}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#EDE9E2'}});
