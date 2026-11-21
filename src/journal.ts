import type { Avatar, Language } from './missions';
import { landmarks, landmarkXP, restoreLandmarkVisits } from './landmarks';
import { currentRun, initialRewards, reachedMilestones, totalXP, type Rewards } from './rewards';

export type Coordinates = { latitude: number; longitude: number };
export type Place = { text: string } | { tag: string };
export type Memory = {
  id: string;
  missionId: number;
  xp: number;
  date: string;
  photo: string;
  place?: Place;
  coordinates?: Coordinates;
};
export type Profile = { name: string; avatar: Avatar };
type Progress = { memories: Memory[]; previousRunCount?: number; rewards: Rewards; visitedLandmarks?: string[] };
export type Player = Progress & { id: string; profile: Profile };
export type Family = { version: 2; language: Language; activeId?: string; players: Player[] };
type LegacyJournal = Progress & { version: 1; language: Language; profile?: Profile };

export const emptyProgress: Progress = { memories: [], rewards: initialRewards };

export function restoreFamily(data: LegacyJournal | Family): Family {
  if (!['en', 'sv'].includes(data.language)) throw new Error('Invalid journal language');
  if (data.version === 1 && Array.isArray(data.memories)) {
    const { profile, memories, previousRunCount, rewards, language } = data;
    return restoreFamily({
      version: 2, language, activeId: profile ? 'original-player' : undefined,
      players: profile ? [{ id: 'original-player', profile, memories, previousRunCount, rewards }] : [],
    });
  }
  if (data.version !== 2 || !Array.isArray(data.players)) throw new Error('Invalid journal');
  return {
    ...data,
    activeId: data.players.find(player => player.id === data.activeId)?.id ?? data.players[0]?.id,
    players: data.players.map(player => ({
      ...player,
      visitedLandmarks: restoreLandmarkVisits(player.visitedLandmarks),
      rewards: {
        ...initialRewards,
        ...player.rewards,
        unlocked: reachedMilestones(totalXP(currentRun(player.memories, player.previousRunCount)) + landmarkXP(player.visitedLandmarks)),
      },
    })),
  };
}

export function replacePlayer(family: Family, id: string | undefined, change: (player: Player) => Player): Family {
  const player = family.players.find(item => item.id === id);
  if (!player) throw new Error('Player is unavailable');
  const next = change(player);
  if (next === player) return family;
  return { ...family, players: family.players.map(item => item === player ? next : item) };
}

export function visitLandmark(player: Player, landmarkId: string): Player {
  if (!landmarks.some(place => place.id === landmarkId)) throw new Error('Unknown landmark');
  const visits = restoreLandmarkVisits(player.visitedLandmarks);
  if (visits.includes(landmarkId)) return player;
  const visitedLandmarks = [...visits, landmarkId];
  const xp = totalXP(currentRun(player.memories, player.previousRunCount)) + landmarkXP(visitedLandmarks);
  return {
    ...player,
    visitedLandmarks,
    rewards: { ...player.rewards, unlocked: reachedMilestones(xp) },
  };
}
