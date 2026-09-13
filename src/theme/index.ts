import { useColorScheme } from 'react-native';
import { useAppStore } from '@/stores/app';

const light = {
  background:'#FAF9F6', surface:'#FFFFFF', surfaceAlt:'#EFEEEB', text:'#1A1C1A',
  textSecondary:'#655F5B', muted:'#918B87', border:'#DFDBD7', accent:'#FF5B49',
  accentPressed:'#D94331', accentSoft:'#FFDAD3', success:'#516300', successSoft:'#EEF5D4', lime:'#CBF230',
  white:'#FFFFFF', overlay:'rgba(16,20,16,0.55)', ink:'#1D1C1A', warning:'#B98336',
  blue:'#819CCD', lilac:'#ABA5D5', mint:'#95B59D', yellow:'#D9D9A3', imageBase:'#747963',
};
const dark:typeof light = {...light,background:'#171614',surface:'#211F1D',surfaceAlt:'#292725',text:'#FAF8F5',textSecondary:'#B9B3A9',muted:'#958F88',border:'#3B3732',accentSoft:'#3A2622',success:'#A9CDA9',successSoft:'#273C2C'};
export const spacing={xs:4,sm:8,md:12,lg:16,xl:20,xxl:24,xxxl:32,huge:40,giant:48};
export const radius={sm:6,md:10,lg:12,xl:14,hero:18,pill:999};
export const motion={duration:240,spring:{damping:20,stiffness:200,mass:0.9}};
export const typography={
 display:{fontSize:40,lineHeight:44,fontWeight:'800' as const,letterSpacing:-1.6},
 title:{fontSize:30,lineHeight:35,fontWeight:'800' as const,letterSpacing:-1.1},
 heading:{fontSize:20,lineHeight:26,fontWeight:'700' as const,letterSpacing:-0.45},
 body:{fontSize:16,lineHeight:24,fontWeight:'400' as const},
 small:{fontSize:14,lineHeight:21,fontWeight:'400' as const},
 label:{fontSize:14,lineHeight:20,fontWeight:'600' as const},
 caption:{fontSize:12,lineHeight:17,fontWeight:'400' as const},
};
export function useTheme(){const preference=useAppStore(s=>s.theme);const system=useColorScheme();return {colors:(preference==='dark'||(preference==='system'&&system==='dark'))?dark:light,spacing,radius};}
