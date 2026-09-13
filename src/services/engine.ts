import type { Activity, ActivityCategory, Constraints, Crew, Move, RankingState, Recommendation, TasteAxis, TasteVector, User } from '../types';

export type { RankingState } from '../types';
export const tasteAxes: TasteAxis[] = ['effort', 'novelty', 'obscurity', 'spontaneity', 'social', 'rawness'];
const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
const mean = (values: number[]) => values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : 0;
const vectorFrom = (get: (axis: TasteAxis) => number): TasteVector => Object.fromEntries(tasteAxes.map((axis) => [axis, get(axis)])) as TasteVector;
const validRank = (move: Move) => move.rank !== undefined && Number.isInteger(move.rank) && move.rank > 0;
export const rankWeight = (rank: number): number => 1 / Math.log2(Math.max(1, rank) + 1.5);

/** Normalize inside each category before a gently capped category-count weighting. */
export function calculateTaste(moves: Move[], activities: Activity[]): TasteVector {
  const catalog = new Map(activities.map((activity) => [activity.id, activity]));
  const buckets = new Map<ActivityCategory, Array<{ move: Move; activity: Activity }>>();
  for (const move of moves) {
    const activity = catalog.get(move.activityId);
    if (!activity || !validRank(move)) continue;
    const entries = buckets.get(move.category) ?? [];
    entries.push({ move, activity });
    buckets.set(move.category, entries);
  }
  if (!buckets.size) return vectorFrom(() => 50);
  const categoryVectors = [...buckets.values()].map((entries) => {
    const weights = entries.map(({ move }) => rankWeight(move.rank!));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    return {
      weight: Math.min(2, Math.sqrt(entries.length)),
      vector: vectorFrom((axis) => entries.reduce((sum, { activity }, i) => sum + clamp(activity.traits[axis]) * weights[i]!, 0) / total),
    };
  });
  const total = categoryVectors.reduce((sum, category) => sum + category.weight, 0);
  return vectorFrom((axis) => Math.round(clamp(categoryVectors.reduce((sum, category) => sum + category.vector[axis] * category.weight, 0) / total)));
}

export function calculateConfidence(rankedCount: number): number {
  return Math.round(clamp(Math.max(0, rankedCount) * 4));
}

/** Breadth of contexts, never spending, miles travelled, or repeated log volume. */
export function calculateRange(moves: Move[], activities: Activity[]): number {
  const ids = new Set(moves.map((move) => move.activityId));
  const tried = activities.filter((activity) => ids.has(activity.id));
  if (!tried.length) return 0;
  const categoryBreadth = Math.min(1, new Set(tried.map((activity) => activity.category)).size / 11);
  const traitBreadth = mean(tasteAxes.map((axis) => {
    const values = tried.map((activity) => clamp(activity.traits[axis]));
    return (Math.max(...values) - Math.min(...values)) / 100;
  }));
  const activityBreadth = Math.min(1, tried.length / 30);
  const knownIds = new Set(tried.map((activity) => activity.id));
  const contexts = new Set(moves.filter((move) => knownIds.has(move.activityId)).map((move) => move.placeName?.trim().toLocaleLowerCase() || 'personal space'));
  const contextBreadth = Math.min(1, contexts.size / 18);
  return Math.round(clamp((categoryBreadth * 0.3 + traitBreadth * 0.3 + activityBreadth * 0.25 + contextBreadth * 0.15) * 100));
}

/** All members have equal weight; dispersion enters overlap and recommendation fairness. */
export function crewTaste(vectors: TasteVector[]): TasteVector {
  return vectorFrom((axis) => vectors.length ? Math.round(mean(vectors.map((vector) => clamp(vector[axis])))) : 50);
}

/** Mean pairwise absolute difference on six axes. This is taste similarity, not friendship quality. */
export function calculateOverlap(vectors: TasteVector[]): number {
  if (vectors.length < 2) return vectors.length === 1 ? 100 : 0;
  let distance = 0;
  let pairs = 0;
  for (let i = 0; i < vectors.length; i++) {
    for (let j = i + 1; j < vectors.length; j++) {
      distance += mean(tasteAxes.map((axis) => Math.abs(clamp(vectors[i]![axis]) - clamp(vectors[j]![axis]))));
      pairs++;
    }
  }
  return Math.round(clamp(100 - distance / pairs));
}

const traitWeights: Record<TasteAxis, number> = { effort: 0.24, novelty: 0.19, obscurity: 0.1, spontaneity: 0.14, social: 0.23, rawness: 0.1 };
function similarity(a: TasteVector, b: TasteVector) {
  return clamp(100 - tasteAxes.reduce((sum, axis) => sum + Math.abs(clamp(a[axis]) - clamp(b[axis])) * traitWeights[axis], 0));
}

function categoryAffinity(user: User, category: ActivityCategory, moves: Move[], catalog: Activity[]): number {
  const ranked = moves.filter((move) => move.userId === user.id && validRank(move));
  const categoryMoves = ranked.filter((move) => move.category === category);
  if (!ranked.length || !categoryMoves.length) {
    const candidates = catalog.filter((activity) => activity.category === category);
    return candidates.length ? mean(candidates.map((activity) => similarity(user.taste, activity.traits))) : 50;
  }
  return clamp(60 + mean(categoryMoves.map((move) => rankWeight(move.rank!))) * 40);
}

/** Local discovery examples, not a live venue availability service. Constraints are hard filters. */
export function recommend(crew: Crew, users: User[], activities: Activity[], moves: Move[], constraints: Constraints): Recommendation[] {
  const members = [...new Set(crew.memberIds)].map((id) => users.find((user) => user.id === id)).filter((user): user is User => !!user);
  if (!members.length) return [];
  const vectors = members.map((user) => {
    const personal = moves.filter((move) => move.userId === user.id);
    return personal.some(validRank) ? calculateTaste(personal, activities) : user.taste;
  });
  const latest = Math.max(0, ...moves.map((move) => Date.parse(move.date)).filter(Number.isFinite));
  const recentSince = latest - 21 * 24 * 60 * 60 * 1000;
  const context = constraints.when.toLowerCase();
  const contextSlot = /weekend/.test(context) ? 'weekend' : /tonight|evening|night/.test(context) ? 'evening' : undefined;
  const memberIds = new Set(members.map((user) => user.id));
  return activities.filter((activity) => {
    if (constraints.budget < 3 && activity.price > constraints.budget) return false;
    if (activity.distance > Math.max(0, constraints.radius)) return false;
    if (constraints.energy !== 'any' && activity.energy !== constraints.energy) return false;
    if (contextSlot && activity.availability && !activity.availability.includes(contextSlot)) return false;
    if (/tonight/.test(context) && (activity.durationMinutes ?? 60) > 180) return false;
    return true;
  }).map((activity) => {
    const memberFit = vectors.map((vector) => similarity(vector, activity.traits));
    const averageFit = mean(memberFit);
    const lowestFit = Math.min(...memberFit);
    const affinity = mean(members.map((user, i) => categoryAffinity({ ...user, taste: vectors[i]! }, activity.category, moves, activities)));
    const recentMoves = moves.filter((move) => move.activityId === activity.id && Date.parse(move.date) >= recentSince && (memberIds.has(move.userId) || move.confirmedParticipantIds.some((id) => memberIds.has(id))));
    const recentParticipants = new Set(recentMoves.flatMap((move) => [move.userId, ...move.confirmedParticipantIds]).filter((id) => memberIds.has(id)));
    const novelty = (members.length - recentParticipants.size) / members.length * 100;
    const fairnessPenalty = (averageFit - lowestFit) * 0.22;
    const repetitionPenalty = Math.min(8, recentMoves.length * 2);
    const distancePenalty = Math.min(4, activity.distance / 8);
    const raw = averageFit * 0.45 + lowestFit * 0.25 + affinity * 0.15 + novelty * 0.15 - fairnessPenalty - repetitionPenalty - distancePenalty;
    const score = Math.round(clamp(55 + raw * 0.45, 0, 97));
    const strongAxis = [...tasteAxes].sort((a, b) => mean(vectors.map((vector) => vector[b])) - mean(vectors.map((vector) => vector[a]))).find((axis) => activity.traits[axis] >= 65);
    const axisNames: Record<TasteAxis, string> = { effort: 'active experiences', novelty: 'trying something new', obscurity: 'less obvious finds', spontaneity: 'a little spontaneity', social: 'doing things together', rawness: 'relaxed, unpolished experiences' };
    const reasons = [strongAxis ? `Your crew leans toward ${axisNames[strongAxis]}.` : 'A balanced fit across your crew’s tastes.'];
    if (!recentParticipants.size) reasons.push('None of your crew has logged this in the last three weeks of your history.');
    else if (recentParticipants.size < members.length) reasons.push(`A fresh option for ${members.length - recentParticipants.size} of ${members.length} people, based on recent logs.`);
    else reasons.push('A familiar option your crew has shared recently.');
    reasons.push(activity.price === 0 ? 'Free, and within your selected distance.' : 'Fits your budget, energy, and distance.');
    return { activity, score, reasons };
  }).sort((a, b) => b.score - a.score || a.activity.id.localeCompare(b.activity.id));
}

export function tasteEvidence(moves: Move[], activities: Activity[]): Array<{ axis: TasteAxis; title: string; message: string; moveIds: string[] }> {
  const catalog = new Map(activities.map((activity) => [activity.id, activity]));
  const top = moves.filter((move) => validRank(move) && catalog.has(move.activityId)).sort((a, b) => a.rank! - b.rank! || b.date.localeCompare(a.date) || a.id.localeCompare(b.id)).slice(0, 10);
  const total = top.length;
  const first = new Map<string, string>();
  for (const move of [...moves].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))) if (!first.has(move.activityId)) first.set(move.activityId, move.id);
  const definitions: Array<{ axis: TasteAxis; title: string; predicate: (move: Move) => boolean; phrase: string }> = [
    { axis: 'social', title: 'Crowd leaning', predicate: (move) => new Set([move.userId, ...move.participantIds]).size >= 4, phrase: 'included at least four people' },
    { axis: 'effort', title: 'Active', predicate: (move) => catalog.get(move.activityId)!.traits.effort >= 65, phrase: 'involved movement or competition' },
    { axis: 'novelty', title: 'New experiences', predicate: (move) => first.get(move.activityId) === move.id, phrase: 'were your first logged experience of that activity' },
    { axis: 'obscurity', title: 'Beyond the obvious', predicate: (move) => catalog.get(move.activityId)!.traits.obscurity >= 60, phrase: 'were less obvious finds' },
    { axis: 'spontaneity', title: 'Room for spontaneity', predicate: (move) => catalog.get(move.activityId)!.traits.spontaneity >= 65, phrase: 'were activities that work well without much planning' },
    { axis: 'rawness', title: 'Easygoing settings', predicate: (move) => catalog.get(move.activityId)!.traits.rawness >= 65, phrase: 'favored casual, unpolished settings' },
  ];
  return definitions.map(({ axis, title, predicate, phrase }) => {
    const evidence = top.filter(predicate);
    return { axis, title, message: total ? `${evidence.length} of your top ${total} ${phrase}.` : 'Rank a few Moves to see the experiences behind this trait.', moveIds: evidence.map((move) => move.id) };
  });
}

export function startRanking(orderedMoveIds: string[]): RankingState {
  const high = orderedMoveIds.length;
  return { low: 0, high, index: Math.floor(high / 2), done: high === 0 };
}

/** Prefer the new Move => upper boundary moves left; prefer opponent => lower boundary moves right. */
export function chooseRanking(state: RankingState, preferNew: boolean): RankingState {
  if (state.done) return { ...state };
  const low = preferNew ? state.low : state.index + 1;
  const high = preferNew ? state.index : state.high;
  return { low, high, index: Math.floor((low + high) / 2), done: low === high };
}

/** Category-local insertion, including safe re-ranking of an existing Move. */
export function insertRankedMove(moves: Move[], moveId: string, index: number): Move[] {
  const target = moves.find((move) => move.id === moveId);
  if (!target || !Number.isFinite(index)) return moves;
  const ordered = moves.filter((move) => move.id !== moveId && move.userId === target.userId && move.category === target.category && validRank(move)).sort((a, b) => a.rank! - b.rank! || a.id.localeCompare(b.id));
  ordered.splice(Math.max(0, Math.min(ordered.length, Math.floor(index))), 0, target);
  const ranks = new Map(ordered.map((move, i) => [move.id, i + 1]));
  return moves.map((move) => ranks.has(move.id) ? { ...move, rank: ranks.get(move.id)! } : move);
}

/** Only accepts a complete permutation, protecting against lost, duplicate, or cross-category rows. */
export function reorderRankedCategory(moves: Move[], userId: string, category: ActivityCategory, orderedMoveIds: string[]): Move[] {
  const ranked = moves.filter((move) => move.userId === userId && move.category === category && validRank(move));
  const supplied = new Set(orderedMoveIds);
  if (supplied.size !== ranked.length || orderedMoveIds.length !== ranked.length || ranked.some((move) => !supplied.has(move.id))) return moves;
  const ranks = new Map(orderedMoveIds.map((id, i) => [id, i + 1]));
  return moves.map((move) => ranks.has(move.id) ? { ...move, rank: ranks.get(move.id)! } : move);
}
