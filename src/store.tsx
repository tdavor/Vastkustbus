import { persistCityPhoto, type CityPhotoDraft } from './city-photo';
import { addSeasonPlace, addSeasonVisit, removeSeasonPlace, removeSeasonVisit } from './seasons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { getLocales } from 'expo-localization';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { missions, type Language } from './missions';
import { emptyProgress, replacePlayer, restoreFamily, visitLandmark, editMemory, type Family, type Memory, type Profile } from './journal';
import { landmarkCheckInXP, landmarkXP } from './landmarks';
export type { Coordinates, Memory, Place } from './journal';
import { currentRun, missionXP, reachedMilestones, totalXP, type Milestone, type Rewards } from './rewards';

const key = 'goteborg-explorer.journal.v1';
const initial: Family = {
  version: 2, language: getLocales()[0]?.languageCode === 'sv' ? 'sv' : 'en', players: [],
};

export const bookDirectory = () => new Directory(Paths.document, 'family-books');

const photoDirectory = () => new Directory(Paths.document, 'memories');
export const photoFile = (name: string) => new File(photoDirectory(), name);

export function savePhoto(uri: string, name: string) {
  photoDirectory().create({ idempotent: true, intermediates: true });
  const destination = photoFile(name);
  if (!destination.exists) {
    try {
      new File(uri).copy(destination);
    } catch (error) {
      if (destination.exists) destination.delete();
      throw error;
    }
  }
}

const pendingReset = JSON.stringify({ ...initial, resetPending: true });

async function finishReset() {
  const photos = photoDirectory();
  if (photos.exists) photos.delete();
  const books = bookDirectory();
  if (books.exists) books.delete();
  await AsyncStorage.removeItem(key);
  return initial;
}

function useJournalState() {
  const [family, setFamily] = useState(initial);
  const current = useRef(initial);
  const resetInProgress = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  async function load() {
    setStatus('loading');
    try {
      const raw = await AsyncStorage.getItem(key);
      const stored = raw ? JSON.parse(raw) : null;
      const data = stored?.resetPending ? await finishReset() : stored ? restoreFamily(stored) : initial;
      if (stored && !stored.resetPending && JSON.stringify(data) !== raw) {
        await AsyncStorage.setItem(key, JSON.stringify(data));
      }
      current.current = data;
      setFamily(data);
      resetInProgress.current = false;
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => { void load(); }, []);

  function enqueue<T>(action: () => Promise<T>): Promise<T> {
    const task = queue.current.then(action);
    queue.current = task.then(() => {}, () => {});
    return task;
  }

  function update(change: (previous: Family) => Family) {
    return enqueue(async () => {
      if (resetInProgress.current) throw new Error('Reset is incomplete');
      const next = change(current.current);
      if (next === current.current) return;
      await AsyncStorage.setItem(key, JSON.stringify(next));
      current.current = next;
      setFamily(next);
    });
  }

  function resetGame() {
    return enqueue(async () => {
      await AsyncStorage.setItem(key, pendingReset);
      resetInProgress.current = true;
      current.current = initial;
      setStatus('loading');
      try {
        setFamily(await finishReset());
        resetInProgress.current = false;
        setStatus('ready');
      } catch (error) {
        setStatus('error');
        throw error;
      }
    });
  }

  async function addMemory(memory: Omit<Memory, 'xp'>) {
    let earned = 0;
    let unlocked: Milestone[] = [];
    await update(state => replacePlayer(state, family.activeId, previous => {
      const duplicate = previous.memories.find(item => item.id === memory.id);
      if (duplicate) {
        earned = duplicate.xp;
        return previous;
      }
      const mission = missions.find(item => item.id === memory.missionId);
      if (!mission || (mission.category === 'legendary' && !previous.rewards.unlocked.includes(1000))) {
        throw new Error('Mission is unavailable');
      }
      const active = currentRun(previous.memories, previous.previousRunCount);
      earned = missionXP(active, mission.id, mission.xp);
      const reached = reachedMilestones(totalXP(active) + landmarkXP(previous.visitedLandmarks) + earned);
      unlocked = reached.filter(mark => !previous.rewards.unlocked.includes(mark));
      return {
        ...previous,
        memories: [{ ...memory, xp: earned }, ...previous.memories],
        rewards: { ...previous.rewards, unlocked: reached },
      };
    }));
    return { earned, unlocked };
  }

  const selected = family.players.find(player => player.id === family.activeId);
  const journal = { ...(selected ?? emptyProgress), profile: selected?.profile, language: family.language };
  const activeMemories = currentRun(journal.memories, journal.previousRunCount);
  return {
    journal, status, load, activeMemories,
    players: family.players, activePlayerId: family.activeId,
    xp: totalXP(activeMemories) + landmarkXP(journal.visitedLandmarks),
    resetGame,
    addPlayer: (profile: Profile) => update(previous => {
      const id = randomUUID();
      return { ...previous, activeId: id, players: [...previous.players, { ...emptyProgress, profile, id }] };
    }),
    selectPlayer: (id: string) => update(previous => {
      if (!previous.players.some(player => player.id === id)) throw new Error('Player is unavailable');
      return id === previous.activeId ? previous : { ...previous, activeId: id };
    }),
    setLanguage: (language: Language) => update(previous => ({ ...previous, language })),
    addMemory,
    addSeasonalPlace: async (name: string, frameHint: string) => {
      const id = randomUUID();
      await update(state => replacePlayer(state, family.activeId, player => addSeasonPlace(player, id, name, frameHint)));
      return id;
    },
    addSeasonalVisit: async (placeId: string, uri: string, date: string, note: string) => {
      const id = randomUUID();
      const filename = `season-${id}.jpg`;
      let copied = false;
      try {
        await update(state => replacePlayer(state, family.activeId, player => {
          const next = addSeasonVisit(player, placeId, { id, date, note, photo: filename });
          savePhoto(uri, filename); copied = true;
          return next;
        }));
      } catch (error) {
        if (copied) { try { const file = photoFile(filename); if (file.exists) file.delete(); } catch {} }
        throw error;
      }
    },
    deleteSeasonalPlace: async (placeId: string) => {
      let filenames: string[] = [];
      await update(state => replacePlayer(state, family.activeId, player => {
        filenames = player.seasonalPlaces?.find(place => place.id === placeId)?.visits.map(visit => visit.photo) ?? [];
        return removeSeasonPlace(player, placeId);
      }));
      for (const name of filenames) { try { const file = photoFile(name); if (file.exists) file.delete(); } catch {} }
    },
    deleteSeasonalVisit: async (placeId: string, visitId: string) => {
      let filename: string | undefined;
      await update(state => replacePlayer(state, family.activeId, player => {
        filename = player.seasonalPlaces?.find(place => place.id === placeId)?.visits.find(visit => visit.id === visitId)?.photo;
        return removeSeasonVisit(player, placeId, visitId);
      }));
      if (filename) { try { const file = photoFile(filename); if (file.exists) file.delete(); } catch {} }
    },
    saveSeasonBook: (uri: string, playerId: string, placeId: string, visitIds: string[]) => enqueue(async () => {
      if (resetInProgress.current) throw new Error('Reset is incomplete');
      const place = current.current.players.find(player => player.id === playerId)?.seasonalPlaces?.find(item => item.id === placeId);
      if (!place || !visitIds.length || visitIds.some(id => !place.visits.some(visit => visit.id === id))) throw new Error('Place is unavailable');
      bookDirectory().create({ idempotent: true, intermediates: true });
      const destination = new File(bookDirectory(), `seasons-${randomUUID()}.pdf`);
      try { new File(uri).copy(destination); }
      catch (error) { if (destination.exists) destination.delete(); throw error; }
      return destination.uri;
    }),
    saveStory: (memoryId: string, story: string) =>
      update(state => replacePlayer(state, family.activeId, player => editMemory(player, memoryId, { story }))),
    saveArtwork: async (memoryId: string, uri: string) => {
      const filename = `artwork-${randomUUID()}.jpg`;
      let oldPhoto: string | undefined;
      let copied = false;
      try {
        await update(state => replacePlayer(state, family.activeId, player => {
          const memory = player.memories.find(item => item.id === memoryId);
          if (!memory) throw new Error('Memory is unavailable');
          oldPhoto = memory.coloredPhoto;
          savePhoto(uri, filename);
          copied = true;
          return editMemory(player, memoryId, { coloredPhoto: filename });
        }));
      } catch (error) {
        if (copied) { try { const file = photoFile(filename); if (file.exists) file.delete(); } catch {} }
        throw error;
      }
      if (oldPhoto) { try { const file = photoFile(oldPhoto); if (file.exists) file.delete(); } catch {} }
    },
    saveFamilyBook: (uri: string, playerId: string, memoryIds: string[]) => enqueue(async () => {
      if (resetInProgress.current) throw new Error('Reset is incomplete');
      const player = current.current.players.find(item => item.id === playerId);
      if (!player || !memoryIds.length || memoryIds.some(id => !player.memories.some(memory => memory.id === id))) throw new Error('Book memories are unavailable');
      bookDirectory().create({ idempotent: true, intermediates: true });
      const destination = new File(bookDirectory(), `family-book-${randomUUID()}.pdf`);
      try { new File(uri).copy(destination); }
      catch (error) { if (destination.exists) destination.delete(); throw error; }
      return destination.uri;
    }),
    saveCityPhoto: (playerId: string, landmarkId: string, uri: string, draft: CityPhotoDraft) => persistCityPhoto({
      playerId, landmarkId, draft, update,
      copyPhoto: () => savePhoto(uri, draft.photo),
      removePhoto: () => { const file = photoFile(draft.photo); if (file.exists) file.delete(); },
    }),
    checkInLandmark: async (landmarkId: string) => {
      let earned = 0;
      await update(state => replacePlayer(state, family.activeId, player => {
        const next = visitLandmark(player, landmarkId);
        if (next !== player) earned = landmarkCheckInXP;
        return next;
      }));
      return earned;
    },
    updateRewards: (change: (rewards: Rewards) => Rewards) =>
      update(state => replacePlayer(state, family.activeId, player => ({ ...player, rewards: change(player.rewards) }))),
  };
}

const JournalContext = createContext<ReturnType<typeof useJournalState> | null>(null);

export function JournalProvider({ children }: { children: ReactNode }) {
  const state = useJournalState();
  return <JournalContext.Provider value={state}>{children}</JournalContext.Provider>;
}

export function useJournal() {
  const context = useContext(JournalContext);
  if (!context) throw new Error('JournalProvider is required');
  return context;
}
