import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { getLocales } from 'expo-localization';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { missions, type Avatar, type Language } from './missions';
import { currentRun, initialRewards, missionXP, reachedMilestones, totalXP, type Milestone, type Rewards } from './rewards';

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
type Profile = { name: string; avatar: Avatar };
type Journal = { version: 1; language: Language; profile?: Profile; memories: Memory[]; previousRunCount?: number; rewards: Rewards };
const key = 'goteborg-explorer.journal.v1';
const initial: Journal = {
  version: 1, language: getLocales()[0]?.languageCode === 'sv' ? 'sv' : 'en', memories: [], rewards: initialRewards,
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
  const [journal, setJournal] = useState(initial);
  const current = useRef(initial);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  async function load() {
    setStatus('loading');
    try {
      const raw = await AsyncStorage.getItem(key);
      const data: Journal = raw ? JSON.parse(raw) : initial;
      if (data.version !== 1 || !Array.isArray(data.memories) || !['en', 'sv'].includes(data.language)) {
        throw new Error('Invalid journal');
      }
      const rewards = { ...initialRewards, ...data.rewards, unlocked: reachedMilestones(totalXP(currentRun(data.memories, data.previousRunCount))) };
      if (raw && (!data.rewards || data.rewards.unlocked?.join() !== rewards.unlocked.join())) {
        await AsyncStorage.setItem(key, JSON.stringify({ ...data, rewards }));
      }
      data.rewards = rewards;
      current.current = data;
      setJournal(data);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => { void load(); }, []);

  function update(change: (previous: Journal) => Journal) {
    const task = queue.current.then(async () => {
      const next = change(current.current);
      if (next === current.current) return;
      await AsyncStorage.setItem(key, JSON.stringify(next));
      current.current = next;
      setJournal(next);
    });
    queue.current = task.catch(() => {});
    return task;
  }

  async function addMemory(memory: Omit<Memory, 'xp'>) {
    let earned = 0;
    let unlocked: Milestone[] = [];
    await update(previous => {
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
    });
    return { earned, unlocked };
  }

  const activeMemories = currentRun(journal.memories, journal.previousRunCount);
  return {
    journal, status, load, activeMemories,
    xp: totalXP(activeMemories),
    resetProgress: () => update(previous => ({
      ...previous, previousRunCount: previous.memories.length, rewards: initialRewards,
    })),
    setProfile: (profile: Profile) => update(previous => ({ ...previous, profile })),
    setLanguage: (language: Language) => update(previous => ({ ...previous, language })),
    addMemory,
    updateRewards: (change: (rewards: Rewards) => Rewards) =>
      update(previous => ({ ...previous, rewards: change(previous.rewards) })),
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
