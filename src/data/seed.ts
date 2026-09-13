import type { Activity, ActivityCategory, AppNotification, Crew, Move, PublicList, TasteVector, User } from '../types';

export const currentUserId = 'shawn';
export const DEMO_DATE = '2026-09-12T18:00:00.000Z';
export const categoryLabels: Record<ActivityCategory, string> = {
  food: 'Food', nightlife: 'Nightlife', active: 'Active', events: 'Events', explore: 'Explore',
  chill: 'Chill', outdoors: 'Outdoors', games: 'Games', creative: 'Creative', campus: 'Campus', other: 'Other',
};
const t = (effort: number, novelty: number, obscurity: number, spontaneity: number, social: number, rawness: number): TasteVector => ({ effort, novelty, obscurity, spontaneity, social, rawness });
export const activities: Activity[] = [
  { id: 'basketball', name: 'Pickup basketball', category: 'active', image: 'basketball', description: 'A few good runs, a little friendly competition, and the kind of evening that flies by.', traits: t(87, 42, 26, 78, 94, 76), placeId: 'arc', placeName: 'ARC', price: 0, minutes: 8, durationMinutes: 75, energy: 'high', distance: 1.2 },
  { id: 'illini', name: 'Illini Basketball', category: 'active', image: 'stadium', description: 'Orange everywhere. Your people next to you. A whole arena pulling for the same thing.', traits: t(48, 40, 12, 38, 97, 40), placeId: 'state-farm', placeName: 'State Farm Center', price: 2, minutes: 12, durationMinutes: 150, energy: 'medium', distance: 2, availability: ['evening', 'weekend'] },
  { id: 'bouldering', name: 'Bouldering', category: 'active', image: 'climbing', description: 'Find your route. Cheer each other on. Try something that feels a little out of reach.', traits: t(82, 79, 65, 58, 78, 77), placeId: 'urbana-boulders', placeName: 'Urbana Boulders', price: 1, minutes: 9, durationMinutes: 90, energy: 'medium', distance: 2.4 },
  { id: 'lift', name: 'ARC lift', category: 'active', image: 'gym', description: 'A familiar routine, a good playlist, and somebody there to spot the last rep.', traits: t(91, 23, 22, 45, 58, 65), placeId: 'arc', placeName: 'ARC', price: 0, minutes: 8, durationMinutes: 60, energy: 'high', distance: 1.2 },
  { id: 'soccer', name: 'Intramural soccer', category: 'active', image: 'volleyball', description: 'One more match under the lights. Bring a team or make one when you get there.', traits: t(91, 43, 35, 45, 96, 83), placeId: 'complex', placeName: 'Campus recreation fields', price: 0, minutes: 10, durationMinutes: 75, energy: 'high', distance: 1.8 },
  { id: 'shawarma', name: 'Late-night shawarma', category: 'food', image: 'food', description: 'The post-everything food stop. Pass the fries, talk a little longer, head home happy.', traits: t(30, 57, 49, 85, 79, 78), placeId: 'shawarma-joint', placeName: 'Shawarma Joint', price: 1, minutes: 8, durationMinutes: 40, energy: 'low', distance: 0.8, availability: ['evening', 'weekend'] },
  { id: 'picnic', name: 'Japan House picnic', category: 'chill', image: 'picnic', description: 'A blanket, something good to eat, and nowhere else you need to be.', traits: t(34, 58, 60, 63, 75, 80), placeId: 'japan-house', placeName: 'Japan House gardens', price: 0, minutes: 14, durationMinutes: 90, energy: 'low', distance: 2.2, availability: ['daytime', 'weekend'] },
  { id: 'bowling', name: 'Bowling night', category: 'games', image: 'bowling', description: 'Questionable form. A lucky strike. The whole crew asking for one more game.', traits: t(53, 47, 30, 70, 92, 62), placeId: 'illini-union', placeName: 'Illini Union', price: 1, minutes: 5, durationMinutes: 75, energy: 'medium', distance: 0.5 },
  { id: 'karaoke', name: 'Karaoke', category: 'nightlife', image: 'concert', description: 'Pick the song everyone knows. Commit to the chorus. Vocal talent optional.', traits: t(57, 69, 45, 78, 97, 89), placeId: 'downtown', placeName: 'Downtown Champaign', price: 1, minutes: 12, durationMinutes: 100, energy: 'high', distance: 2.6, availability: ['evening', 'weekend'] },
  { id: 'krannert', name: 'Krannert performance', category: 'events', image: 'concert', description: 'Trade a familiar night for a live performance that stays with you.', traits: t(36, 83, 72, 35, 62, 29), placeId: 'krannert', placeName: 'Krannert Center', price: 1, minutes: 9, durationMinutes: 120, energy: 'low', distance: 0.8, availability: ['evening', 'weekend'] },
  { id: 'orchard', name: 'Curtis Orchard', category: 'outdoors', image: 'orchard', description: 'A slow afternoon outside, apple cider, and a very good excuse to leave campus.', traits: t(45, 73, 56, 41, 76, 78), placeId: 'curtis-orchard', placeName: 'Curtis Orchard', price: 1, minutes: 22, durationMinutes: 120, energy: 'medium', distance: 8, availability: ['daytime', 'weekend'] },
  { id: 'chicago', name: 'Chicago day trip', category: 'explore', image: 'city', description: 'Take the day. Walk a new neighborhood. Let the city give you a few good surprises.', traits: t(74, 92, 47, 29, 77, 56), placeId: 'chicago', placeName: 'Chicago', price: 2, minutes: 145, durationMinutes: 480, energy: 'high', distance: 135, availability: ['daytime', 'weekend'] },
  { id: 'thrift', name: 'Thrift run', category: 'explore', image: 'thrift', description: 'Browse without a plan and come back with something nobody else has.', traits: t(55, 85, 78, 77, 61, 87), placeId: 'downtown', placeName: 'Downtown Champaign', price: 1, minutes: 12, durationMinutes: 90, energy: 'medium', distance: 2.6, availability: ['daytime', 'weekend'] },
  { id: 'boardgames', name: 'Board game night', category: 'games', image: 'games', description: 'Clear the table. Explain the rules twice. Find out who gets surprisingly competitive.', traits: t(28, 58, 62, 64, 88, 83), price: 0, minutes: 0, durationMinutes: 120, energy: 'low', distance: 0 },
  { id: 'trivia', name: 'Trivia night', category: 'games', image: 'games', description: 'One team name, too many strong opinions, and the perfect niche fact at the perfect time.', traits: t(37, 69, 60, 47, 87, 66), placeId: 'downtown', placeName: 'Downtown Champaign', price: 1, minutes: 12, durationMinutes: 90, energy: 'medium', distance: 2.6, availability: ['evening', 'weekend'] },
  { id: 'market', name: 'Farmers market', category: 'food', image: 'orchard', description: 'Fresh pastries, local finds, and a morning that starts a little slower.', traits: t(39, 71, 66, 56, 60, 75), placeId: 'market', placeName: 'Urbana Market at the Square', price: 1, minutes: 15, durationMinutes: 60, energy: 'low', distance: 2.8, availability: ['daytime', 'weekend'] },
  { id: 'movie', name: 'Movie night', category: 'chill', image: 'movie', description: 'Something everyone agrees on eventually. Snacks within reach. Phones face down.', traits: t(12, 39, 43, 66, 66, 60), price: 0, minutes: 0, durationMinutes: 120, energy: 'low', distance: 0 },
  { id: 'study', name: 'Study session', category: 'campus', image: 'study', description: 'Get a little done together. The coffee break counts too.', traits: t(54, 18, 22, 54, 52, 33), placeId: 'library', placeName: 'Main Library', price: 0, minutes: 5, durationMinutes: 120, energy: 'low', distance: 0.4 },
  { id: 'early-lift', name: '6 AM lift', category: 'active', image: 'gym', description: 'Quiet racks, a clear head, and your whole day still ahead of you.', traits: t(96, 36, 60, 14, 34, 72), placeId: 'arc', placeName: 'ARC', price: 0, minutes: 8, durationMinutes: 60, energy: 'high', distance: 1.2, availability: ['daytime'] },
  { id: 'coffee', name: 'Coffee run', category: 'chill', image: 'coffee', description: 'A small detour for a good cup and a conversation you do not have to rush.', traits: t(19, 44, 40, 82, 52, 44), placeId: 'cafe-bene', placeName: 'Café Bené', price: 1, minutes: 4, durationMinutes: 40, energy: 'low', distance: 0.3 },
  { id: 'volleyball', name: 'Volleyball', category: 'active', image: 'volleyball', description: 'Make room for one more. A casual game has a way of becoming the whole afternoon.', traits: t(80, 54, 38, 79, 96, 83), placeId: 'complex', placeName: 'Campus recreation fields', price: 0, minutes: 10, durationMinutes: 75, energy: 'high', distance: 1.8, availability: ['daytime', 'weekend'] },
  { id: 'jazz', name: 'Live jazz', category: 'nightlife', image: 'concert', description: 'A small stage, a good seat, and musicians making the room feel different.', traits: t(24, 81, 85, 51, 56, 68), placeId: 'downtown', placeName: 'Downtown Champaign', price: 1, minutes: 12, durationMinutes: 90, energy: 'low', distance: 2.6, availability: ['evening', 'weekend'] },
  { id: 'ceramics', name: 'Ceramics workshop', category: 'creative', image: 'ceramics', description: 'Use your hands. Make something imperfect. Leave with a story and maybe a bowl.', traits: t(49, 92, 81, 28, 59, 90), placeId: 'arts-studio', placeName: 'Community arts studio', price: 2, minutes: 14, durationMinutes: 120, energy: 'medium', distance: 3, availability: ['daytime', 'weekend'] },
  { id: 'hammock', name: 'Quad hammock', category: 'chill', image: 'hammock', description: 'Claim a little shade. Read half a chapter. Let the rest of the afternoon happen.', traits: t(8, 31, 45, 90, 35, 88), placeId: 'quad', placeName: 'Main Quad', price: 0, minutes: 3, durationMinutes: 60, energy: 'low', distance: 0.2, availability: ['daytime', 'weekend'] },
  { id: 'walk', name: 'Campus walk', category: 'outdoors', image: 'walk', description: 'No destination required. Sometimes the best part of a day is walking it off.', traits: t(38, 40, 23, 95, 50, 80), placeId: 'quad', placeName: 'Main Quad', price: 0, minutes: 3, durationMinutes: 40, energy: 'low', distance: 0.2 },
  { id: 'late-food', name: 'Late-night food', category: 'food', image: 'food', description: 'Follow the collective craving. The best conversations often happen over the last meal.', traits: t(22, 46, 27, 96, 84, 79), placeId: 'green-street', placeName: 'Green Street', price: 1, minutes: 5, durationMinutes: 45, energy: 'low', distance: 0.5, availability: ['evening', 'weekend'] },
];

export const users: User[] = [
  { id: 'shawn', username: 'shawn', displayName: 'Shawn Muppaneni', avatar: 'shawn', campus: 'UIUC', taste: t(68, 66, 51, 67, 84, 65) },
  { id: 'maya', username: 'maya', displayName: 'Maya Chen', avatar: 'maya', campus: 'UIUC', taste: t(60, 90, 81, 69, 74, 67) },
  { id: 'alex', username: 'alex', displayName: 'Alex Kim', avatar: 'alex', campus: 'UIUC', taste: t(86, 47, 42, 39, 87, 66) },
  { id: 'ryan', username: 'ryan', displayName: 'Ryan Patel', avatar: 'ryan', campus: 'UIUC', taste: t(71, 87, 65, 88, 91, 75) },
  { id: 'noah', username: 'noah', displayName: 'Noah Williams', avatar: 'noah', campus: 'UIUC', taste: t(51, 65, 51, 64, 84, 63) },
];

// Individual, dated experiences. Repeats count as logged life but never inflate Range.
const history = [
  'bouldering', 'illini', 'lift', 'soccer', 'picnic', 'movie', 'coffee', 'shawarma', 'market', 'late-food',
  'bowling', 'boardgames', 'trivia', 'karaoke', 'krannert', 'orchard', 'thrift', 'study', 'walk',
  'basketball', 'lift', 'shawarma', 'movie', 'coffee', 'basketball', 'study', 'bowling', 'late-food',
  'soccer', 'picnic', 'coffee', 'lift', 'boardgames', 'shawarma', 'basketball', 'study', 'walk',
  'coffee', 'movie', 'late-food', 'soccer', 'bowling', 'lift', 'picnic', 'shawarma', 'basketball',
  'coffee', 'study', 'walk', 'trivia', 'movie', 'lift', 'late-food', 'basketball', 'coffee',
  'shawarma', 'soccer', 'study', 'boardgames', 'bowling', 'picnic', 'coffee', 'lift', 'movie',
  'basketball', 'late-food', 'walk', 'study', 'shawarma', 'coffee', 'soccer', 'basketball',
];
const initialRankIds: Partial<Record<ActivityCategory, string[]>> = {
  active: ['illini', 'bouldering', 'lift', 'soccer'], chill: ['picnic', 'movie', 'coffee'],
  food: ['shawarma', 'market', 'late-food'], games: ['bowling', 'boardgames', 'trivia'],
  nightlife: ['karaoke'], events: ['krannert'], outdoors: ['orchard', 'walk'], explore: ['thrift'], campus: ['study'],
};
const boysIndices = new Set([1, 3, 10, 19, 24, 26, 28, 34, 40, 41, 45, 53, 59, 71]);
const roomIndices = new Set([5, 11, 17, 22, 25, 32, 35, 46, 51]);
const rdIndices = new Set([7, 12, 16, 33, 49, 68]);
const weekendIndices = new Set([4, 8, 15, 29, 43]);
export const initialMoves: Move[] = history.map((id, index) => {
  const activity = activities.find((item) => item.id === id)!;
  const date = new Date(Date.UTC(2026, 7, 6 + Math.floor(index / 2), 17 + index % 4)).toISOString();
  const participants = boysIndices.has(index) ? ['alex', 'ryan', 'noah'] : roomIndices.has(index) ? ['alex', 'noah'] : rdIndices.has(index) ? ['maya', 'alex'] : weekendIndices.has(index) ? ['maya', 'ryan'] : index % 3 === 0 ? ['maya'] : [];
  const ranked = index < 19 ? (initialRankIds[activity.category]?.indexOf(id) ?? -1) + 1 : 0;
  return {
    id: `seed-${String(index + 1).padStart(3, '0')}`, userId: currentUserId, activityId: id,
    category: activity.category, placeName: activity.placeName, date, createdAt: date,
    participantIds: participants, confirmedParticipantIds: [...participants],
    visibility: 'friends', locationVisibility: activity.placeName ? 'approximate' : 'hidden',
    ...(ranked > 0 ? { rank: ranked } : {}),
    ...(id === 'illini' ? { note: 'Still thinking about that last shot.' } : {}),
  };
});
export const seedCrews: Crew[] = [
  { id: 'boys', name: 'The Boys', memberIds: ['shawn', 'alex', 'ryan', 'noah'], image: 'friends', sharedMoveIds: [...boysIndices].map((i) => initialMoves[i]!.id) },
  { id: 'room-412', name: 'Room 412', memberIds: ['shawn', 'alex', 'noah'], image: 'games', sharedMoveIds: [...roomIndices].map((i) => initialMoves[i]!.id) },
  { id: 'rd', name: 'R&D', memberIds: ['shawn', 'maya', 'alex'], image: 'coffee', sharedMoveIds: [...rdIndices].map((i) => initialMoves[i]!.id) },
  { id: 'weekenders', name: 'The Weekenders', memberIds: ['shawn', 'maya', 'ryan'], image: 'picnic', sharedMoveIds: [...weekendIndices].map((i) => initialMoves[i]!.id) },
];

export const publicLists: PublicList[] = [
  { id: 'maya-uiuc', userId: 'maya', title: '5 UIUC Moves Worth Leaving Campus For', subtitle: 'Fall 2026 · Curated by Maya', activityIds: ['orchard', 'chicago', 'krannert', 'thrift', 'jazz'] },
  { id: 'cheap-friday', userId: 'alex', title: '5 Cheap Friday Moves', subtitle: 'Good nights, student budgets', activityIds: ['basketball', 'bowling', 'boardgames', 'shawarma', 'walk'] },
  { id: 'game-day', userId: 'ryan', title: 'Best Game-Day Moves', subtitle: 'For the whole crew', activityIds: ['illini', 'basketball', 'late-food', 'bowling'] },
];
export const friendMoves: Move[] = [
  { id: 'invited-basketball', userId: 'alex', activityId: 'basketball', category: 'active', placeName: 'ARC', date: '2026-09-12T17:00:00.000Z', createdAt: '2026-09-12T18:00:00.000Z', participantIds: ['shawn', 'ryan', 'noah'], confirmedParticipantIds: ['ryan', 'noah'], visibility: 'friends', locationVisibility: 'approximate', note: 'Good runs with the crew.' },
  { id: 'maya-bouldering', userId: 'maya', activityId: 'bouldering', category: 'active', placeName: 'Urbana Boulders', date: '2026-09-11T18:00:00.000Z', createdAt: '2026-09-11T20:00:00.000Z', participantIds: [], confirmedParticipantIds: [], visibility: 'public', locationVisibility: 'approximate', rank: 1, note: 'Finally got the route that had me stuck all week.' },
  { id: 'alex-lift', userId: 'alex', activityId: 'lift', category: 'active', placeName: 'ARC', date: '2026-09-10T18:00:00.000Z', createdAt: '2026-09-10T19:00:00.000Z', participantIds: [], confirmedParticipantIds: [], visibility: 'public', locationVisibility: 'approximate', rank: 1 },
  { id: 'ryan-picnic', userId: 'ryan', activityId: 'picnic', category: 'chill', placeName: 'Japan House gardens', date: '2026-09-09T18:00:00.000Z', createdAt: '2026-09-09T20:00:00.000Z', participantIds: [], confirmedParticipantIds: [], visibility: 'public', locationVisibility: 'approximate', rank: 1 },
];
export const notifications: AppNotification[] = [
  { id: 'tag-basketball', title: 'Alex tagged you in a Move', body: 'Pickup basketball. Confirm the tag to add it to your history.', date: '2026-09-12T17:00:00Z', route: '/move/invited-basketball', userId: 'alex' },
  { id: 'list-maya', title: 'Worth leaving campus for', body: 'Maya shared 5 UIUC Moves for your next free afternoon.', date: '2026-09-11T14:00:00Z', route: '/list/maya-uiuc', userId: 'maya' },
  { id: 'taste-update', title: 'Your taste is taking shape', body: 'See the experiences behind your Tasteprint.', date: '2026-09-10T14:00:00Z', route: '/taste' },
  { id: 'recap-ready', title: 'Your story so far', body: 'A look back at your Moves, people, and discoveries.', date: '2026-09-09T14:00:00Z', route: '/recap' },
];
