export type ActivityCategory = 'food' | 'nightlife' | 'active' | 'events' | 'explore' | 'chill' | 'outdoors' | 'games' | 'creative' | 'campus' | 'other';
export type TasteAxis = 'effort' | 'novelty' | 'obscurity' | 'spontaneity' | 'social' | 'rawness';
export type TasteVector = Record<TasteAxis, number>;
export type Visibility = 'private' | 'friends' | 'public';
export type LocationVisibility = 'exact' | 'approximate' | 'hidden';
export type Energy = 'low' | 'medium' | 'high';
export type AppTheme = 'light' | 'dark' | 'system';
export interface Activity {
  id: string; name: string; category: ActivityCategory; image: string; description: string;
  traits: TasteVector; placeId?: string; placeName?: string; price: 0 | 1 | 2;
  minutes: number; energy: Energy; distance: number;
  /** Typical duration, separate from travel time. */
  durationMinutes?: number;
  /** Discovery context, not verified venue opening hours. */
  availability?: Array<'daytime' | 'evening' | 'weekend'>;
}
export interface User { id: string; username: string; displayName: string; avatar: string; campus: string; taste: TasteVector }
export interface Move {
  id: string; userId: string; activityId: string; category: ActivityCategory; placeName?: string;
  date: string; note?: string; photo?: string; participantIds: string[]; confirmedParticipantIds: string[];
  visibility: Visibility; locationVisibility: LocationVisibility; rank?: number; createdAt: string;
  /** A quick 1–5 reflection used by the post-Move photo queue. */
  ratings?: Partial<Record<TasteAxis, number>>;
  /** Copy of a tagged experience, created only after this user explicitly confirms. */
  sourceMoveId?: string;
}
export interface Crew { id: string; name: string; memberIds: string[]; image: string; sharedMoveIds: string[] }
export type ProposalResponse = 'yes' | 'maybe' | 'no' | 'pending';
export interface Proposal {
  id: string; crewId: string; activityId: string; scheduledAt: string; status: 'draft' | 'sent' | 'confirmed';
  fit: number; reasons: string[]; responses: Record<string, ProposalResponse>;
}
export interface Recommendation { activity: Activity; score: number; reasons: string[] }
export interface Constraints { when: string; energy: Energy | 'any'; budget: 0 | 1 | 2 | 3; radius: number }
/** [low, high] are possible insertion boundaries; index is the current opponent, or final boundary. */
export interface RankingState { low: number; high: number; index: number; done: boolean }
export interface PublicList { id: string; userId: string; title: string; subtitle: string; activityIds: string[] }
export interface Place { id: string; name: string; description: string; image: string; activityIds: string[] }
export interface AppNotification { id: string; title: string; body: string; date: string; route: string; userId?: string }
