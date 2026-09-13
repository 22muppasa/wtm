import { activities, friendMoves, publicLists, users } from '../data/seed';
import { useAppStore } from '../stores/app';
import type { Activity, Crew, Move, Place, Proposal, User } from '../types';

export interface CatalogRepository {
  activities(): Activity[]; activity(id: string): Activity | undefined;
  users(): User[]; user(id: string): User | undefined;
  search(query: string): { activities: Activity[]; users: User[]; places: Array<{ id: string; name: string }>; lists: Array<{ id: string; title: string }> };
}
export interface MoveRepository { all(userId: string): Move[]; get(id: string): Move | undefined }
export interface CrewRepository { all(userId: string): Crew[]; get(id: string): Crew | undefined }
export interface ProposalRepository { all(crewId: string): Proposal[]; get(id: string): Proposal | undefined }

export const places: Place[] = [...new Set(activities.flatMap((activity) => activity.placeId ? [activity.placeId] : []))].map((id) => {
  const local = activities.filter((activity) => activity.placeId === id);
  return { id, name: local[0]!.placeName!, image: local[0]!.image, description: 'A setting for your next good experience.', activityIds: local.map((activity) => activity.id) };
});
const normalized = (value: string) => value.trim().toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
export const catalog: CatalogRepository = {
  activities: () => activities, activity: (id) => activities.find((activity) => activity.id === id),
  users: () => users, user: (id) => users.find((user) => user.id === id || user.username === id),
  search: (query) => {
    const q = normalized(query);
    if (!q) return { activities: [], users: [], places: [], lists: [] };
    const found = activities.filter((activity) => normalized(`${activity.name} ${activity.category} ${activity.description} ${activity.placeName ?? ''}`).includes(q));
    const matchingPlaces = new Set(found.flatMap((activity) => activity.placeId ? [activity.placeId] : []));
    return {
      activities: found,
      users: users.filter((user) => normalized(`${user.displayName} ${user.username} ${user.campus}`).includes(q)),
      places: places.filter((place) => normalized(place.name).includes(q) || matchingPlaces.has(place.id)).map(({ id, name }) => ({ id, name })),
      lists: publicLists.filter((list) => normalized(list.title).includes(q) || list.activityIds.some((id) => found.some((activity) => activity.id === id))).map(({ id, title }) => ({ id, title })),
    };
  },
};

// UI can replace these synchronous local adapters with an asynchronous authenticated repository boundary later.
export const moveRepository: MoveRepository = { all: (userId) => [...useAppStore.getState().moves, ...friendMoves].filter((move) => move.userId === userId), get: (id) => [...useAppStore.getState().moves, ...friendMoves].find((move) => move.id === id) };
export const crewRepository: CrewRepository = { all: (userId) => useAppStore.getState().crews.filter((crew) => crew.memberIds.includes(userId)), get: (id) => useAppStore.getState().crews.find((crew) => crew.id === id) };
export const proposalRepository: ProposalRepository = { all: (crewId) => useAppStore.getState().proposals.filter((proposal) => proposal.crewId === crewId), get: (id) => useAppStore.getState().proposals.find((proposal) => proposal.id === id) };
