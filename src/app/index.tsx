import {Redirect} from 'expo-router';
import {useAppStore} from '@/stores/app';
export default function Index(){const onboarded=useAppStore(s=>s.onboarded);return <Redirect href={onboarded?'/(tabs)/home':'/onboarding'}/>;}
