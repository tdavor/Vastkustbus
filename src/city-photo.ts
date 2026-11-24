import { replacePlayer, visitLandmark, type Family, type Memory, type Player } from './journal';
import { landmarkXP } from './landmarks';

export type CityPhotoDraft = Pick<Memory, 'id' | 'date' | 'photo'>;

export function appendCityPhoto(player: Player, landmarkId: string, draft: CityPhotoDraft): Player {
  if (!draft.id || !Number.isFinite(Date.parse(draft.date)) || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*\.(jpg|jpeg|png|webp)$/i.test(draft.photo)) throw new Error('Invalid photo');
  const duplicate = player.memories.find(memory => memory.id === draft.id);
  if (duplicate) {
    if (duplicate.landmarkId !== landmarkId || duplicate.photo !== draft.photo) throw new Error('Photo ID conflict');
    return player;
  }
  const visited = visitLandmark(player, landmarkId);
  // City XP belongs to the visit stamp, never to each additional photo.
  const memory: Memory = { ...draft, missionId: 0, landmarkId, xp: 0 };
  return { ...visited, memories: [memory, ...visited.memories] };
}

export async function persistCityPhoto(options: {
  playerId: string; landmarkId: string; draft: CityPhotoDraft;
  update: (change: (family: Family) => Family) => Promise<void>;
  copyPhoto: () => void; removePhoto: () => void;
}) {
  let copied = false, earned = 0;
  try {
    await options.update(state => {
      if (state.activeId !== options.playerId) throw new Error('Player changed');
      return replacePlayer(state, options.playerId, player => {
        const next = appendCityPhoto(player, options.landmarkId, options.draft);
        if (next === player) return player;
        earned = landmarkXP(next.visitedLandmarks) - landmarkXP(player.visitedLandmarks);
        options.copyPhoto(); copied = true;
        return next;
      });
    });
  } catch (error) {
    if (copied) { try { options.removePhoto(); } catch {} }
    throw error;
  }
  return { earned, id: options.draft.id };
}
