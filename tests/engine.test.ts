import assert from 'node:assert/strict';
import test from 'node:test';
import { activities, currentUserId, initialMoves, seedCrews, users } from '../src/data/seed';
import { calculateConfidence, calculateOverlap, calculateRange, calculateTaste, chooseRanking, crewTaste, insertRankedMove, recommend, reorderRankedCategory, startRanking, tasteAxes, tasteEvidence } from '../src/services/engine';
import type { Activity, Constraints, Move, TasteVector, User } from '../src/types';

const vector = (n: number): TasteVector => ({ effort: n, novelty: n, obscurity: n, spontaneity: n, social: n, rawness: n });
const activity = (id: string, value: number, category: Activity['category'] = 'active'): Activity => ({ id, name: id, category, traits: vector(value), image: 'climbing', description: '', price: 0, minutes: 0, durationMinutes: 60, energy: 'medium', distance: 0 });
const move = (id: string, activityId: string, rank?: number, category: Move['category'] = 'active'): Move => ({ id, activityId, category, userId: 'shawn', date: '2026-09-01T10:00:00Z', createdAt: '2026-09-01T10:00:00Z', participantIds: [], confirmedParticipantIds: [], visibility: 'friends', locationVisibility: 'hidden', ...(rank ? { rank } : {}) });
const constraints: Constraints = { when: 'Tonight', energy: 'medium', budget: 1, radius: 5 };

test('seed integrity: 72 real personal logs, 26 unique catalog activities, 4 valid crews, contiguous category rankings', () => {
  assert.equal(initialMoves.length, 72);
  assert.equal(new Set(initialMoves.map((m) => m.id)).size, 72);
  assert.ok(initialMoves.every((m) => m.userId === currentUserId));
  assert.equal(activities.length, 26);
  assert.equal(new Set(activities.map((a) => a.id)).size, 26);
  assert.equal(seedCrews.length, 4);
  assert.equal(seedCrews.find((c) => c.id === 'boys')?.sharedMoveIds.length, 14);
  const activityMap = new Map(activities.map((a) => [a.id, a]));
  for (const m of initialMoves) {
    assert.equal(m.category, activityMap.get(m.activityId)?.category);
    assert.ok(Number.isFinite(Date.parse(m.date)));
    assert.ok(m.confirmedParticipantIds.every((id) => m.participantIds.includes(id)));
  }
  for (const category of new Set(initialMoves.map((m) => m.category))) {
    const ranks = initialMoves.filter((m) => m.category === category && m.rank).map((m) => m.rank!).sort((a, b) => a - b);
    assert.deepEqual(ranks, ranks.map((_, i) => i + 1));
  }
  for (const crew of seedCrews) for (const id of crew.sharedMoveIds) {
    const shared = initialMoves.find((m) => m.id === id)!;
    assert.ok(shared);
    assert.ok(crew.memberIds.every((member) => member === shared.userId || shared.confirmedParticipantIds.includes(member)));
  }
});

test('binary insertion finds every boundary for lists of length zero through 64 within a logarithmic number of comparisons', () => {
  for (let length = 0; length <= 64; length++) {
    for (let target = 0; target <= length; target++) {
      let state = startRanking(Array.from({ length }, (_, i) => String(i)));
      let comparisons = 0;
      while (!state.done) {
        assert.ok(state.index >= 0 && state.index < length);
        assert.ok(comparisons <= 8, 'Search must terminate');
        state = chooseRanking(state, target <= state.index);
        comparisons++;
      }
      assert.equal(state.index, target, `length=${length}, target=${target}`);
      assert.ok(comparisons <= Math.ceil(Math.log2(length + 1)));
      assert.deepEqual(chooseRanking(state, true), state, 'Completed search is stable');
    }
  }
});

test('skip/cancel leaves inputs and unranked history unchanged; ranking state is immutable', () => {
  const ids = ['a', 'b', 'c'];
  const original = [...ids];
  const state = startRanking(ids);
  const snapshot = { ...state };
  chooseRanking(state, true);
  assert.deepEqual(state, snapshot);
  assert.deepEqual(ids, original);
  assert.equal(move('new', 'basketball').rank, undefined);
});

test('rank insertion and re-ranking preserve other categories and users and produce contiguous ranks', () => {
  const before = [move('a', 'illini', 1), move('b', 'lift', 2), move('new', 'basketball'), move('food', 'shawarma', 1, 'food'), { ...move('friend', 'bouldering', 1), userId: 'maya' }];
  const ranked = insertRankedMove(before, 'new', 1);
  assert.equal(ranked.find((m) => m.id === 'new')?.rank, 2);
  assert.equal(ranked.find((m) => m.id === 'b')?.rank, 3);
  assert.equal(ranked.find((m) => m.id === 'food'), before[3]);
  assert.equal(ranked.find((m) => m.id === 'friend'), before[4]);
  assert.equal(before[2]!.rank, undefined);
  const reranked = insertRankedMove(ranked, 'new', 99);
  assert.equal(reranked.find((m) => m.id === 'new')?.rank, 3);
  assert.equal(insertRankedMove(reranked, 'new', -5).find((m) => m.id === 'new')?.rank, 1);
  assert.equal(insertRankedMove(before, 'missing', 0), before);
  assert.equal(insertRankedMove(before, 'new', NaN), before);
});

test('manual reordering rejects partial, duplicated, or foreign lists and accepts complete permutations', () => {
  const before = [move('a', 'illini', 1), move('b', 'lift', 2), move('food', 'shawarma', 1, 'food')];
  for (const invalid of [['a'], ['a', 'a'], ['a', 'food']]) assert.equal(reorderRankedCategory(before, 'shawn', 'active', invalid), before);
  const after = reorderRankedCategory(before, 'shawn', 'active', ['b', 'a']);
  assert.equal(after[0]!.rank, 2);
  assert.equal(after[1]!.rank, 1);
  assert.equal(after[2], before[2]);
});

test('Tasteprint uses ranked, known moves and weights higher ranks more strongly', () => {
  assert.deepEqual(calculateTaste([], activities), vector(50));
  const catalog = [activity('high', 100), activity('low', 0)];
  const highFirst = calculateTaste([move('a', 'high', 1), move('b', 'low', 2)], catalog);
  const lowFirst = calculateTaste([move('a', 'high', 2), move('b', 'low', 1)], catalog);
  assert.ok(highFirst.effort > 50);
  assert.ok(lowFirst.effort < 50);
  assert.deepEqual(calculateTaste([move('a', 'high'), move('missing', 'missing', 1)], catalog), vector(50));
  assert.deepEqual(calculateTaste([move('a', 'high', 1), move('b', 'low')], catalog), vector(100));
});

test('category normalization prevents 40 moves overwhelming six in a different category', () => {
  const catalog = [activity('high', 100), activity('low', 0, 'food')];
  const history = [...Array.from({ length: 40 }, (_, i) => move(`high-${i}`, 'high', i + 1)), ...Array.from({ length: 6 }, (_, i) => move(`low-${i}`, 'low', i + 1, 'food'))];
  assert.deepEqual(calculateTaste(history, catalog), vector(50));
});

test('confidence is bounded, deterministic, and reflects actual ranked-count thresholds', () => {
  for (const [count, expected] of [[-1, 0], [0, 0], [5, 20], [10, 40], [15, 60], [20, 80], [25, 100], [200, 100]]) assert.equal(calculateConfidence(count!), expected);
  assert.equal(calculateConfidence(initialMoves.filter((m) => m.rank !== undefined).length), 76);
});

test('Range increases with breadth while repeated logs, cost, and travel do not increase it', () => {
  assert.equal(calculateRange([], activities), 0);
  const narrow = [move('a', 'basketball')];
  const repeated = Array.from({ length: 100 }, (_, i) => ({ ...narrow[0]!, id: `repeat-${i}` }));
  assert.equal(calculateRange(narrow, activities), calculateRange(repeated, activities));
  const broad = [...narrow, move('b', 'ceramics', undefined, 'creative'), move('c', 'hammock', undefined, 'chill')];
  assert.ok(calculateRange(broad, activities) > calculateRange(narrow, activities));
  assert.equal(calculateRange(broad, activities), calculateRange(broad, activities.map((a) => ({ ...a, price: 2, distance: 10000 }))));
  assert.equal(calculateRange(broad, activities), calculateRange([...broad, { ...move('unknown', 'unknown'), placeName: 'Unknown place' }], activities));
  assert.ok(calculateRange(initialMoves, activities) >= 0 && calculateRange(initialMoves, activities) <= 100);
});

test('crew average and pairwise overlap are symmetric, bounded, and handle empty/singleton groups', () => {
  assert.deepEqual(crewTaste([]), vector(50));
  assert.deepEqual(crewTaste([vector(20), vector(80)]), vector(50));
  assert.equal(calculateOverlap([]), 0);
  assert.equal(calculateOverlap([vector(34)]), 100);
  assert.equal(calculateOverlap([vector(50), vector(50)]), 100);
  assert.equal(calculateOverlap([vector(0), vector(100)]), 0);
  const inputs = users.map((u) => u.taste);
  assert.equal(calculateOverlap(inputs), calculateOverlap([...inputs].reverse()));
});

test('recommendations respect hard budget, distance, energy and time constraints; deterministic finite fit under 100', () => {
  const crew = seedCrews[0]!;
  const result = recommend(crew, users, activities, initialMoves, constraints);
  assert.ok(result.length > 0);
  assert.deepEqual(result, recommend(crew, users, activities, initialMoves, constraints));
  for (const rec of result) {
    assert.ok(rec.activity.price <= 1 && rec.activity.distance <= 5 && rec.activity.energy === 'medium');
    assert.ok(!rec.activity.availability || rec.activity.availability.includes('evening'));
    assert.ok(rec.score >= 0 && rec.score <= 97);
    assert.equal(rec.reasons.length, 3);
  }
  assert.ok(!result.some((r) => r.activity.id === 'chicago'));
  assert.equal(recommend({ ...crew, memberIds: [] }, users, activities, initialMoves, constraints).length, 0);
  assert.deepEqual(recommend(crew, users, activities, initialMoves, { ...constraints, radius: -1, budget: 0, energy: 'high' }), []);
});

test('recommendation fairness protects one strongly dissatisfied member from a majority-only choice', () => {
  const memberUsers: User[] = [0, 1, 2, 3, 4].map((i) => ({ id: `u${i}`, username: `u${i}`, displayName: `User ${i}`, campus: 'UIUC', avatar: 'shawn', taste: vector(i === 4 ? 0 : 100) }));
  const crew = { id: 'test', name: 'Test', memberIds: memberUsers.map((u) => u.id), image: 'friends', sharedMoveIds: [] };
  const result = recommend(crew, memberUsers, [activity('extreme', 100), activity('balanced', 50)], [], constraints);
  assert.equal(result[0]!.activity.id, 'balanced');
});

test('recent repeated activities receive a penalty and explanations are grounded in logs', () => {
  const memberUsers: User[] = [{ id: 'shawn', username: 'shawn', displayName: 'Shawn', campus: 'UIUC', avatar: 'shawn', taste: vector(50) }];
  const crew = { id: 'test', name: 'Test', memberIds: ['shawn'], image: 'friends', sharedMoveIds: [] };
  const catalog = [activity('familiar', 50), activity('fresh', 50)];
  const result = recommend(crew, memberUsers, catalog, [move('a', 'familiar'), move('b', 'familiar')], constraints);
  assert.equal(result[0]!.activity.id, 'fresh');
  assert.ok(result[0]!.score > result[1]!.score);
  assert.match(result[0]!.reasons[1]!, /None/);
  assert.match(result[1]!.reasons[1]!, /familiar/);
});

test('evidence counts actual participant groups and first logged experiences without invented planning timestamps', () => {
  const history = [move('old', 'basketball'), { ...move('new', 'basketball', 1), date: '2026-09-02T10:00:00Z', participantIds: ['alex', 'ryan', 'noah'] }, move('coffee', 'coffee', 1, 'chill')];
  const evidence = tasteEvidence(history, activities);
  assert.equal(evidence.length, tasteAxes.length);
  assert.deepEqual(evidence.find((e) => e.axis === 'social')!.moveIds, ['new']);
  assert.deepEqual(evidence.find((e) => e.axis === 'novelty')!.moveIds, ['coffee']);
  assert.match(evidence.find((e) => e.axis === 'social')!.message, /^1 of your top 2/);
  assert.doesNotMatch(evidence.find((e) => e.axis === 'spontaneity')!.message, /six hours|planned within/);
  assert.ok(tasteEvidence([], activities).every((e) => e.moveIds.length === 0));
});
