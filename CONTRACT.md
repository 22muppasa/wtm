# Shared implementation contract

Root owns package/config, src/components, src/theme, src/app layout and Home/Explore/Activity pages, assets, QA.
Domain agent owns src/types/index.ts, src/data, src/services, src/repositories, src/stores, tests, supabase/schema.sql, .env.example.
Flow agent owns src/features/log, src/features/onboarding and routes src/app/log.tsx, src/app/rank/[moveId].tsx, src/app/onboarding.tsx.
Social agent owns src/features/social and routes src/app/(tabs)/crews.tsx, you.tsx, src/app/crew, proposal, taste, profile, list, recap, settings.tsx, notifications.tsx, move/[id].tsx.

UI imports from @/components/ui: Screen({children,scroll?:boolean,padded?:boolean,style?}), T({children,variant?:'display'|'title'|'heading'|'body'|'small'|'label'|'caption',color?,style?,numberOfLines?}), Button({title,onPress,variant?:'primary'|'secondary'|'ghost',icon?:Feather icon name,disabled?,loading?,style?}), IconButton({name,onPress,label?,color?}), Header({title?,subtitle?,back?:boolean,right?}), Section({title,action?,onAction?}), Chip({label,selected?,onPress,icon?}), Field({value,onChangeText,placeholder, multiline?, ...TextInputProps}), Avatar({userId?,size?}), AvatarStack({ids,size?}), Photo({image:string,style?,children?}), ActivityCard({activity,compact?:boolean,onPress?,match?}), ActivityRow({activity,onPress?,rank?,subtitle?,right?}), Sheet({visible,onClose,title,children}), Empty({title,body,action?,onAction?}), Divider, Brand({size?:number}), Toast handled via useUIStore.
TasteprintShape from @/components/TasteprintShape: {vector:TasteVector,size?:number,labels?:boolean,overlay?:TasteVector,animated?:boolean}.
useTheme from @/theme gives {colors,spacing,radius}; colors background,surface,surfaceAlt,text,textSecondary,muted,border,accent,accentSoft,success,successSoft,white,overlay.
Spacing tokens xs=4,sm=8,md=12,lg=16,xl=20,xxl=24,xxxl=32. Font definitions are in T. Use gap and standard semantic token values.

Data contract (domain agent implements these exact names; can extend):
ActivityCategory union food|nightlife|active|events|explore|chill|outdoors|games|creative|campus|other.
TasteVector Record<'effort'|'novelty'|'obscurity'|'spontaneity'|'social'|'rawness',number> using 0–100.
Activity {id,name,category,image:string,description,traits:TasteVector,placeId?:string,placeName?:string,price:number [0/1/2],minutes:number,energy:'low'|'medium'|'high',distance:number}
User {id,username,displayName,avatar:string,campus:string,taste:TasteVector}
Move {id,userId,activityId,category,placeName?:string,date,note?:string,photo?:string,participantIds:string[],confirmedParticipantIds:string[],visibility:'private'|'friends'|'public',locationVisibility:'exact'|'approximate'|'hidden',rank?:number,createdAt}
Crew {id,name,memberIds:string[],image:string,sharedMoveIds:string[]}
Proposal {id,crewId,activityId,scheduledAt:string,status:'draft'|'sent'|'confirmed',fit:number,reasons:string[],responses:Record<string,'yes'|'maybe'|'no'|'pending'>}
Recommendation {activity:Activity,score:number,reasons:string[]}
Constraints {when:string,energy:'low'|'medium'|'high'|'any',budget:0|1|2|3,radius:number}

Data @/data/seed exports activities,users,seedCrews,categoryLabels,currentUserId='shawn', initialMoves. Required activity ids basketball,illini,bouldering,lift,soccer,shawarma,picnic,bowling,karaoke,krannert,orchard,chicago,thrift,boardgames,trivia,market,movie,study,early-lift,coffee,volleyball,jazz,ceramics,hammock,walk,late-food. users shawn,maya,alex,ryan,noah. Crew id boys. Image values are keys: climbing,basketball,stadium,food,picnic,bowling,concert,orchard,city,thrift,games,movie,study,gym,coffee,volleyball,ceramics,hammock,walk,friends,shawn,maya,alex,ryan,noah. Root will map to bundled files.

@/stores/app useAppStore Zustand persistent state: hydrated:boolean,onboarded:boolean,campus:string,defaultVisibility:Visibility,moves:Move[],crews:Crew[],proposals:Proposal[],savedIds:string[],savedListIds:string[],followingIds:string[],theme:'light'|'dark'|'system',fridayMode:boolean,notificationReadIds:string[]. Actions: completeOnboarding(activityIds?:string[]):void,setCampus(string),setVisibility(Visibility),setTheme(theme),setFridayMode(boolean),logMove(Omit<Move,'id'|'userId'|'createdAt'>):string,updateMove(id,Partial<Move>),rankMove(moveId,index zero based),reorderCategory(category,orderedMoveIds),toggleSave(activityId),toggleSaveList(id),toggleFollow(id),createCrew(name,memberIds):string,createProposal({crewId,activityId,scheduledAt,fit,reasons}):string,sendProposal(id),respondProposal(id,userId,response),confirmProposal(id),readNotification(id),resetDemo(),replayOnboarding(), getTaste? (prefer derived service). Data starts 72 actual moves, taste confidence based on actual ranked count, 4 crews. Store methods synchronous. Demo proposal response simulation must be labeled in UI.
@/stores/ui useUIStore {toast:string|null,showToast(message):void,clearToast():void}.
@/services/engine exports calculateTaste(moves,activities):TasteVector,calculateConfidence(rankedCount):number,calculateRange(moves,activities):number,calculateOverlap(vectors:TasteVector[]):number,crewTaste(vectors):TasteVector,recommend(crew:Crew,users:User[],activities:Activity[],moves:Move[],constraints:Constraints):Recommendation[],tasteEvidence(moves,activities):{axis:keyof TasteVector,title:string,message:string,moveIds:string[]}[], startRanking(orderedMoveIds:string[]):{low,high,index,done}, chooseRanking(state,preferNew:boolean):same state. Binary insertion no hardcoded placement. Empty rank starts done at index 0. Use store.rankMove(id,state.index).
@/repositories exports catalog {activities():Activity[],activity(id):Activity|undefined,users():User[],user(id):User|undefined,search(query):{activities,users,places:{id,name}[],lists:{id,title}[]}} and selectors/functions as useful.

Routes: /(tabs)/home,explore,crews,you. Log pushed via /log (no tab screen). /activity/[id],/place/[id],/move/[id],/rank/[moveId],/taste,/taste/[axis],/taste/history,/crew/[id],/crew/[id]/recommend,/proposal/[id],/profile/[username],/list/[id],/recap,/settings,/notifications,/onboarding.
Do not edit other owners' files. Communicate contract additions. Route files may re-export feature screens. No stub buttons; show honest local-demo copy for simulations. No external messages or backend writes.
