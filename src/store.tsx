import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { getLocales } from 'expo-localization';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { missions, type Language } from './missions';
import { emptyProgress, replacePlayer, restoreFamily, type Family, type Memory, type Profile } from './journal';
export type { Coordinates, Memory, Place } from './journal';
import { currentRun, initialRewards, missionXP, reachedMilestones, totalXP, type Milestone, type Rewards } from './rewards';

const key = 'goteborg-explorer.journal.v1';
const initial: Family = {
  version: 2, language: getLocales()[0]?.languageCode === 'sv' ? 'sv' : 'en', players: [],
};

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

function useJournalState() {
  const [family, setFamily] = useState(initial);
  const current = useRef(initial);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  async function load() {
    setStatus('loading');
    try {
      const raw = await AsyncStorage.getItem(key);
      const data = raw ? restoreFamily(JSON.parse(raw)) : initial;
      if (raw && JSON.stringify(data) !== raw) {
        await AsyncStorage.setItem(key, JSON.stringify(data));
      }
      current.current = data;
      setFamily(data);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => { void load(); }, []);

  function update(change: (previous: Family) => Family) {
    const task = queue.current.then(async () => {
      const next = change(current.current);
      if (next === current.current) return;
      await AsyncStorage.setItem(key, JSON.stringify(next));
      current.current = next;
      setFamily(next);
    });
    queue.current = task.catch(() => {});
    return task;
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
      const reached = reachedMilestones(totalXP(active) + earned);
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
    xp: totalXP(activeMemories),
    resetProgress: () => update(state => replacePlayer(state, family.activeId, player => ({
      ...player, previousRunCount: player.memories.length, rewards: initialRewards,
    }))),
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
