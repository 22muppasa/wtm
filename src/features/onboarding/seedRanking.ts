import { activities, currentUserId } from '@/data/seed';
import { chooseRanking, startRanking } from '@/services/engine';
import type { ActivityCategory, Move, RankingState, Visibility } from '@/types';

export interface SeedRankingSession {
  ranked: Partial<Record<ActivityCategory, string[]>>;
  remaining: string[];
  currentId?: string;
  opponents: string[];
  search?: RankingState;
  comparisons: number;
}

// First experiences need no comparison. Subsequent experiences are inserted
// only among activities of the same category, using the shared ranking engine.
function advance(ranked: SeedRankingSession['ranked'], remaining: string[], comparisons: number): SeedRankingSession {
  const nextRanked = { ...ranked };
  const pending = [...remaining];
  while (pending.length) {
    const currentId = pending.shift()!;
    const activity = activities.find(item => item.id === currentId);
    if (!activity) continue;
    const opponents = nextRanked[activity.category] ?? [];
    if (!opponents.length) { nextRanked[activity.category] = [currentId]; continue; }
    return { ranked: nextRanked, remaining: pending, currentId, opponents, search: startRanking(opponents), comparisons };
  }
  return { ranked: nextRanked, remaining: [], opponents: [], comparisons };
}

export function startSeedRanking(activityIds: string[]): SeedRankingSession {
  return advance({}, [...new Set(activityIds)], 0);
}

export function chooseSeedRanking(session: SeedRankingSession, preferNew: boolean): SeedRankingSession {
  const activity = activities.find(item => item.id === session.currentId);
  if (!session.search || !activity) return session;
  const next = chooseRanking(session.search, preferNew);
  if (!next.done) return { ...session, search: next, comparisons: session.comparisons + 1 };
  const ordered = [...session.opponents];
  ordered.splice(next.index, 0, activity.id);
  return advance({ ...session.ranked, [activity.category]: ordered }, session.remaining, session.comparisons + 1);
}

export function seedRankingIds(session: SeedRankingSession): string[] {
  return Object.values(session.ranked).flatMap(ids => ids ?? []);
}

export function seedPreviewMoves(session: SeedRankingSession, visibility: Visibility): Move[] {
  const now = new Date().toISOString();
  return Object.entries(session.ranked).flatMap(([category, ids]) => (ids ?? []).map((id, index) => ({
    id: 'preview-' + id, userId: currentUserId, activityId: id, category: category as ActivityCategory,
    date: now, createdAt: now, participantIds: [], confirmedParticipantIds: [], visibility,
    locationVisibility: 'hidden' as const, rank: index + 1,
  })));
}
