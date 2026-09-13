import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { activities, currentUserId, initialMoves, seedCrews, users } from '../data/seed';
import { insertRankedMove, reorderRankedCategory } from '../services/engine';
import type { ActivityCategory, AppTheme, Crew, Move, Proposal, ProposalResponse, Visibility } from '../types';

type NewMove = Omit<Move, 'id' | 'userId' | 'createdAt'>;
type NewProposal = Pick<Proposal, 'crewId' | 'activityId' | 'scheduledAt' | 'fit' | 'reasons'>;
export interface AppState {
  hydrated: boolean; persistenceError: string | null; onboarded: boolean; campus: string; defaultVisibility: Visibility;
  moves: Move[]; crews: Crew[]; proposals: Proposal[]; savedIds: string[]; savedListIds: string[]; followingIds: string[];
  theme: AppTheme; fridayMode: boolean; notificationReadIds: string[];
  completeOnboarding: (activityIds?: string[]) => void;
  setCampus: (campus: string) => void; setVisibility: (visibility: Visibility) => void;
  setTheme: (theme: AppTheme) => void; setFridayMode: (enabled: boolean) => void;
  logMove: (move: NewMove) => string; updateMove: (id: string, patch: Partial<Move>) => void;
  rankMove: (id: string, index: number) => void; reorderCategory: (category: ActivityCategory, orderedMoveIds: string[]) => void;
  toggleSave: (activityId: string) => void; toggleSaveList: (id: string) => void; toggleFollow: (id: string) => void;
  createCrew: (name: string, memberIds: string[]) => string;
  createProposal: (proposal: NewProposal) => string; updateProposal: (id: string, patch: Partial<Proposal>) => void;
  sendProposal: (id: string) => void; respondProposal: (id: string, userId: string, response: ProposalResponse) => void;
  confirmProposal: (id: string) => void; readNotification: (id: string) => void;
  resetDemo: () => void; replayOnboarding: () => void;
}

let sequence = 0;
function makeId(prefix: string) { sequence += 1; return `${prefix}-${Date.now().toString(36)}-${sequence.toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const toggle = (values: string[], value: string) => values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
const validUserIds = new Set(users.map((user) => user.id));
function initialData() {
  return {
    onboarded: false, campus: 'UIUC', defaultVisibility: 'friends' as Visibility,
    moves: clone(initialMoves), crews: clone(seedCrews), proposals: [] as Proposal[],
    savedIds: ['bouldering', 'orchard', 'ceramics'], savedListIds: [] as string[], followingIds: ['maya', 'alex', 'ryan', 'noah'],
    theme: 'light' as AppTheme, fridayMode: false, notificationReadIds: [] as string[],
  };
}

// The local demo stores only ordinary app data. A future auth adapter must use SecureStore for credentials.
export const useAppStore = create<AppState>()(persist((set, get) => ({
  ...initialData(), hydrated: false, persistenceError: null,
  completeOnboarding: (activityIds) => {
    if (!activityIds) { set({ onboarded: true }); return; }
    const selected = [...new Set(activityIds)].map((id) => activities.find((activity) => activity.id === id)).filter((activity) => !!activity);
    const ranks: Partial<Record<ActivityCategory, number>> = {};
    const now = new Date().toISOString();
    const moves: Move[] = selected.map((activity) => {
      const rank = (ranks[activity.category] ?? 0) + 1;
      ranks[activity.category] = rank;
      return { id: makeId('onboarding'), userId: currentUserId, activityId: activity.id, category: activity.category, date: now, createdAt: now, rank, participantIds: [], confirmedParticipantIds: [], visibility: get().defaultVisibility, locationVisibility: 'hidden' };
    });
    set({ onboarded: true, moves, crews: [], proposals: [], savedIds: [], notificationReadIds: [] });
  },
  setCampus: (campus) => { if (campus.trim()) set({ campus: campus.trim().slice(0, 100) }); },
  setVisibility: (defaultVisibility) => set({ defaultVisibility }),
  setTheme: (theme) => set({ theme }), setFridayMode: (fridayMode) => set({ fridayMode }),
  logMove: (input) => {
    const confirmedCopy = input.sourceMoveId ? get().moves.find((move) => move.userId === currentUserId && move.sourceMoveId === input.sourceMoveId) : undefined;
    if (confirmedCopy) return confirmedCopy.id;
    const activity = activities.find((item) => item.id === input.activityId);
    if (!activity) throw new Error('Choose an activity before logging your Move.');
    if (!Number.isFinite(Date.parse(input.date))) throw new Error('Choose a valid date for your Move.');
    const id = makeId('move');
    const participantIds = [...new Set(input.participantIds)].filter((userId) => userId !== currentUserId && validUserIds.has(userId));
    const placeName = input.placeName?.trim() || undefined;
    const privatePlace = !placeName || /\b(home|apartment|dorm|room)\b/i.test(placeName);
    const move: Move = {
      ...input, id, userId: currentUserId, activityId: activity.id, category: activity.category,
      date: new Date(input.date).toISOString(), createdAt: new Date().toISOString(),
      placeName, note: input.note?.trim().slice(0, 1000) || undefined,
      participantIds, confirmedParticipantIds: [],
      locationVisibility: privatePlace ? 'hidden' : input.locationVisibility,
      // Logging and preference ranking are separate actions.
      rank: undefined,
    };
    set((state) => ({ moves: [...state.moves, move], savedIds: state.savedIds.filter((saved) => saved !== activity.id) }));
    return id;
  },
  updateMove: (id, patch) => set((state) => {
    const target = state.moves.find((move) => move.id === id && move.userId === currentUserId);
    if (!target) return {};
    const activity = activities.find((item) => item.id === (patch.activityId ?? target.activityId));
    if (!activity || (patch.date && !Number.isFinite(Date.parse(patch.date)))) return {};
    const participantIds = [...new Set(patch.participantIds ?? target.participantIds)].filter((userId) => userId !== currentUserId && validUserIds.has(userId));
    const placeName = (patch.placeName !== undefined ? patch.placeName : target.placeName)?.trim() || undefined;
    const updated: Move = {
      ...target, ...patch, id: target.id, userId: target.userId, createdAt: target.createdAt,
      activityId: activity.id, category: activity.category, placeName, participantIds,
      confirmedParticipantIds: target.confirmedParticipantIds.filter((userId) => participantIds.includes(userId)),
      rank: activity.category === target.category ? target.rank : undefined,
      locationVisibility: !placeName || /\b(home|apartment|dorm|room)\b/i.test(placeName) ? 'hidden' : patch.locationVisibility ?? target.locationVisibility,
    };
    let moves = state.moves.map((move) => move.id === id ? updated : move);
    if (target.category !== activity.category && target.rank) {
      const previous = moves.filter((move) => move.userId === currentUserId && move.category === target.category && move.rank).sort((a, b) => a.rank! - b.rank!);
      const ranks = new Map(previous.map((move, i) => [move.id, i + 1]));
      moves = moves.map((move) => ranks.has(move.id) ? { ...move, rank: ranks.get(move.id) } : move);
    }
    return { moves };
  }),
  rankMove: (id, index) => set((state) => state.moves.some((move) => move.id === id && move.userId === currentUserId) ? { moves: insertRankedMove(state.moves, id, index) } : {}),
  reorderCategory: (category, ids) => set((state) => ({ moves: reorderRankedCategory(state.moves, currentUserId, category, ids) })),
  toggleSave: (id) => { if (activities.some((activity) => activity.id === id)) set((state) => ({ savedIds: toggle(state.savedIds, id) })); },
  toggleSaveList: (id) => set((state) => ({ savedListIds: toggle(state.savedListIds, id) })),
  toggleFollow: (id) => { if (id !== currentUserId && validUserIds.has(id)) set((state) => ({ followingIds: toggle(state.followingIds, id) })); },
  createCrew: (name, ids) => {
    const cleanName = name.trim().slice(0, 60);
    if (!cleanName) throw new Error('Give your crew a name.');
    const memberIds = [...new Set([currentUserId, ...ids])].filter((id) => validUserIds.has(id));
    if (memberIds.length < 2) throw new Error('Choose at least one other person.');
    const id = makeId('crew');
    const sharedMoveIds = get().moves.filter((move) => memberIds.every((userId) => userId === move.userId || move.confirmedParticipantIds.includes(userId))).map((move) => move.id);
    set((state) => ({ crews: [...state.crews, { id, name: cleanName, memberIds, image: 'friends', sharedMoveIds }] }));
    return id;
  },
  createProposal: (input) => {
    const crew = get().crews.find((item) => item.id === input.crewId && item.memberIds.includes(currentUserId));
    if (!crew || !activities.some((activity) => activity.id === input.activityId)) throw new Error('Choose an activity and a crew first.');
    if (!Number.isFinite(Date.parse(input.scheduledAt))) throw new Error('Choose a valid time for your Move.');
    const id = makeId('proposal');
    const proposal: Proposal = { ...input, id, scheduledAt: new Date(input.scheduledAt).toISOString(), fit: Math.max(0, Math.min(97, Math.round(input.fit))), status: 'draft', responses: Object.fromEntries(crew.memberIds.map((userId) => [userId, userId === currentUserId ? 'yes' : 'pending'])) };
    set((state) => ({ proposals: [...state.proposals, proposal] }));
    return id;
  },
  updateProposal: (id, patch) => set((state) => ({ proposals: state.proposals.map((proposal) => {
    if (proposal.id !== id || proposal.status !== 'draft' || (patch.scheduledAt && !Number.isFinite(Date.parse(patch.scheduledAt)))) return proposal;
    return { ...proposal, ...(patch.scheduledAt ? { scheduledAt: new Date(patch.scheduledAt).toISOString() } : {}) };
  }) })),
  sendProposal: (id) => set((state) => ({ proposals: state.proposals.map((proposal) => proposal.id === id && proposal.status === 'draft' ? { ...proposal, status: 'sent' } : proposal) })),
  respondProposal: (id, userId, response) => set((state) => ({ proposals: state.proposals.map((proposal) => proposal.id === id && proposal.status !== 'draft' && Object.prototype.hasOwnProperty.call(proposal.responses, userId) ? { ...proposal, responses: { ...proposal.responses, [userId]: response } } : proposal) })),
  confirmProposal: (id) => set((state) => ({ proposals: state.proposals.map((proposal) => {
    const yesCount = Object.values(proposal.responses).filter((response) => response === 'yes').length;
    // Confirmation means a viable plan with at least two attendees, not invented unanimity.
    return proposal.id === id && proposal.status === 'sent' && proposal.responses[currentUserId] === 'yes' && yesCount >= 2 ? { ...proposal, status: 'confirmed' } : proposal;
  }) })),
  readNotification: (id) => set((state) => ({ notificationReadIds: [...new Set([...state.notificationReadIds, id])] })),
  resetDemo: () => set({ ...initialData(), onboarded: true, hydrated: true, persistenceError: null }),
  replayOnboarding: () => set({ ...initialData(), onboarded: false, hydrated: true, persistenceError: null }),
}), {
  name: 'wtm-local-v1', version: 1, storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({ onboarded: state.onboarded, campus: state.campus, defaultVisibility: state.defaultVisibility, moves: state.moves, crews: state.crews, proposals: state.proposals, savedIds: state.savedIds, savedListIds: state.savedListIds, followingIds: state.followingIds, theme: state.theme, fridayMode: state.fridayMode, notificationReadIds: state.notificationReadIds }),
  onRehydrateStorage: () => (state, error) => {
    // Do not leave the splash screen stuck if browser/private-storage access fails.
    queueMicrotask(() => useAppStore.setState({ hydrated: true, persistenceError: error ? 'Local storage was unavailable. Changes may not survive a restart.' : null }));
  },
}));
