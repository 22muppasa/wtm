import type {Activity,TasteVector} from '@/types';
export function matchScore(taste:TasteVector,activity:Activity){const keys=Object.keys(taste) as (keyof TasteVector)[];const distance=keys.reduce((s,k)=>s+Math.abs(taste[k]-activity.traits[k]),0)/(keys.length*100);return Math.round(Math.max(55,Math.min(97,97-distance*42)));}
