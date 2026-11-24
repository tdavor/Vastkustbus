import AsyncStorage from '@react-native-async-storage/async-storage';
import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from 'expo-crypto';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Modal, Text, TextInput, View } from 'react-native';
import { isPlayBuild } from './distribution';
import { matchesPIN, restorePIN, validPIN, type ParentPIN } from './parent-pin';
import { useJournal } from './store';
import { copy } from './text';
import { Button, colors, Page, styles } from './ui';

const key = 'minnetrail.parent-pin.v1';
type Reason = 'sharing' | 'external' | 'settings';
const ParentContext = createContext<{ authorize: (reason: Reason) => Promise<boolean>; changePIN: () => Promise<void> } | null>(null);
export function useParentalGate() {
  const context = useContext(ParentContext);
  if (!context) throw new Error('ParentGateProvider is required');
  return context;
}
export function ParentGateProvider({ children }: { children: ReactNode }) {
  const { journal: { language }, activePlayerId } = useJournal();
  const t = copy[language];
  const [loaded, setLoaded] = useState(!isPlayBuild);
  const [loadError, setLoadError] = useState(false);
  const [record, setRecord] = useState<ParentPIN>();
  const recordRef = useRef<ParentPIN | undefined>(undefined);
  const [dialog, setDialog] = useState<Reason | 'setup'>();
  const [value, setValue] = useState('');
  const [first, setFirst] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const attempts = useRef(0);
  const blockedUntil = useRef(0);
  const pending = useRef<((value: boolean) => void) | undefined>(undefined);
  const alive = useRef(true);
  const settle = useCallback((allowed: boolean) => {
    generation.current++;
    const resolve = pending.current; pending.current = undefined;
    setDialog(undefined); setValue(''); setFirst(''); setError('');
    resolve?.(allowed);
  }, []);
  async function load() {
    setLoadError(false);
    try {
      const raw = await AsyncStorage.getItem(key);
      const restored = raw ? restorePIN(raw) : undefined;
      if (!alive.current) return;
      recordRef.current = restored; setRecord(restored); setLoaded(true);
    } catch { if (alive.current) setLoadError(true); }
  }
  useEffect(() => {
    alive.current = true;
    if (isPlayBuild) void load();
    const listener = AppState.addEventListener('change', state => { if (state !== 'active') settle(false); });
    return () => { alive.current = false; generation.current++; pending.current?.(false); pending.current = undefined; listener.remove(); };
  }, [settle]);
  useEffect(() => { if (pending.current) settle(false); }, [activePlayerId, settle]);
  const authorize = useCallback(async (reason: Reason) => {
    if (!isPlayBuild) return true;
    if (!recordRef.current || pending.current || !alive.current || AppState.currentState !== 'active') return false;
    setValue(''); setError(''); setDialog(reason);
    return new Promise<boolean>(resolve => { pending.current = resolve; });
  }, []);
  async function changePIN() {
    if (!isPlayBuild || !await authorize('settings')) return;
    setFirst(''); setValue(''); setError(''); setDialog('setup');
  }
  async function submit() {
    if (lock.current) return;
    if (Date.now() < blockedUntil.current) { setError(t.parentWait); return; }
    if (!validPIN(value)) { setError(t.parentSixDigits); return; }
    const setup = !recordRef.current || dialog === 'setup';
    if (setup && !first) { setFirst(value); setValue(''); setError(''); return; }
    if (setup && first !== value) { setFirst(''); setValue(''); setError(t.parentMismatch); return; }
    lock.current = true; setBusy(true); setError('');
    const token = generation.current;
    try {
      const salt = setup ? randomUUID() : recordRef.current!.salt;
      const hash = await digestStringAsync(CryptoDigestAlgorithm.SHA256, `${salt}:${value}`);
      if (token !== generation.current || !alive.current || AppState.currentState !== 'active') return;
      if (!setup && !matchesPIN(recordRef.current!.hash, hash)) {
        attempts.current++;
        if (attempts.current >= 5) { blockedUntil.current = Date.now() + 60000; attempts.current = 0; }
        setValue(''); setError(Date.now() < blockedUntil.current ? t.parentWait : t.parentWrong); return;
      }
      if (setup) {
        const next = { salt, hash };
        await AsyncStorage.setItem(key, JSON.stringify(next));
        recordRef.current = next;
        if (alive.current) setRecord(next);
        if (token !== generation.current) return;
      }
      attempts.current = 0; blockedUntil.current = 0; settle(!setup);
    } catch { if (alive.current && token === generation.current) setError(t.saveError); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  const setup = !record || dialog === 'setup';
  const visible = isPlayBuild && loaded && setup || Boolean(dialog);
  return <ParentContext.Provider value={{ authorize, changePIN }}>
    {isPlayBuild && !loaded ? <Page><Text style={styles.heading}>{t.parentTitle}</Text><Text style={styles.body}>{loadError ? t.parentLoadError : t.parentLoading}</Text>{loadError && <Button title={t.retry} icon="reload" onPress={() => { void load(); }} />}</Page> : children}
    <Modal transparent visible={visible} animationType="fade" onRequestClose={() => { if (record && !busy) settle(false); }}>
      <View style={{ flex: 1, backgroundColor: '#173D30DD', justifyContent: 'center', padding: 24 }}>
        <View accessibilityViewIsModal style={[styles.card, { width: '100%', maxWidth: 460, alignSelf: 'center' }]}>
          <Text accessibilityRole="header" style={styles.heading}>{t.parentTitle}</Text>
          <Text style={styles.body}>{setup ? first ? t.parentConfirmPIN : t.parentSetup : t.parentEnterPIN}</Text>
          {!setup && <Text style={styles.small}>{dialog === 'sharing' ? t.parentShareWarning : t.parentExternalWarning}</Text>}
          <TextInput accessibilityLabel={t.parentPIN} value={value} onChangeText={text => setValue(text.replace(/\D/g, '').slice(0, 6))} maxLength={6}
            secureTextEntry keyboardType="number-pad" autoComplete="off" editable={!busy} style={styles.input} />
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          <Button title={setup ? first ? t.parentSavePIN : t.parentContinue : t.parentUnlock} icon="lock-closed-outline" disabled={busy || !validPIN(value)} onPress={() => { void submit(); }} />
          {!!record && <Button title={t.cancel} icon="close" tone="quiet" disabled={busy} onPress={() => settle(false)} />}
          <Text style={styles.small}>{t.parentForgot}</Text>
        </View>
      </View>
    </Modal>
  </ParentContext.Provider>;
}
