import { useColorScheme } from 'react-native';
import { useAppStore } from '@/stores/app';

const light = {
  background:'#FAF8F5', surface:'#FFFFFF', surfaceAlt:'#F3F0EC', text:'#1D1C1A',
  textSecondary:'#706D68', muted:'#9B9892', border:'#E8E4DF', accent:'#FF6854',
  accentPressed:'#E95A48', accentSoft:'#FFF0EC', success:'#3D714F', successSoft:'#EAF1E7',
  white:'#FFFFFF', overlay:'rgba(16,20,16,0.55)', ink:'#1D1C1A', warning:'#B98336',
  blue:'#819CCD', lilac:'#ABA5D5', mint:'#95B59D', yellow:'#D9D9A3', imageBase:'#747963',
};
const dark:typeof light = {...light,background:'#171614',surface:'#211F1D',surfaceAlt:'#292725',text:'#FAF8F5',textSecondary:'#B9B3A9',muted:'#958F88',border:'#3B3732',accentSoft:'#3A2622',success:'#A9CDA9',successSoft:'#273C2C'};
export const spacing={xs:4,sm:8,md:12,lg:16,xl:20,xxl:24,xxxl:32,huge:40,giant:48};
export const radius={sm:10,md:16,lg:20,xl:24,hero:28,pill:999};
export const motion={duration:240,spring:{damping:20,stiffness:200,mass:0.9}};
export const typography={
 display:{fontSize:36,lineHeight:41,fontWeight:'700' as const,letterSpacing:-1.4},
 title:{fontSize:29,lineHeight:35,fontWeight:'700' as const,letterSpacing:-1},
 heading:{fontSize:21,lineHeight:27,fontWeight:'600' as const,letterSpacing:-0.5},
 body:{fontSize:16,lineHeight:24,fontWeight:'400' as const},
 small:{fontSize:14,lineHeight:21,fontWeight:'400' as const},
 label:{fontSize:14,lineHeight:20,fontWeight:'600' as const},
 caption:{fontSize:12,lineHeight:17,fontWeight:'400' as const},
};
export function useTheme(){const preference=useAppStore(s=>s.theme);const system=useColorScheme();return {colors:(preference==='dark'||(preference==='system'&&system==='dark'))?dark:light,spacing,radius};}
