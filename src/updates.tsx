import { isPlayBuild } from './distribution';
import Constants from 'expo-constants';
import { CryptoDigestAlgorithm, digest } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable, getContentUriAsync } from 'expo-file-system/legacy';
import { startActivityAsync } from 'expo-intent-launcher';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Platform, Text, View } from 'react-native';
import type { Language } from './missions';
import { copy } from './text';
import { Button, colors, styles } from './ui';
import { availableAPK, latestReleaseUrl, latestTagsUrl, newerVersion } from './update-versions';

type Phase = 'idle' | 'checking' | 'downloading' | 'verifying' | 'installing';
type Feedback = 'updateCurrent' | 'updatePending' | 'updateError' | 'updateCancelled' | 'updateAndroidOnly';
type APK = NonNullable<ReturnType<typeof availableAPK>>;

async function fetchJSON(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal, headers: { Accept: 'application/vnd.github+json', 'Cache-Control': 'no-cache' },
  });
  if (response.status === 404 && url === latestReleaseUrl) return undefined;
  if (!response.ok) throw new Error('Update check failed');
  return response.json();
}

function confirmDownload(language: Language, apk: APK): Promise<boolean> {
  const t = copy[language];
  return new Promise(resolve => Alert.alert(t.updateTitle, t.updateMessage.replace('{version}', apk.version), [
    { text: t.cancel, style: 'cancel', onPress: () => resolve(false) },
    { text: t.downloadUpdate, onPress: () => resolve(true) },
  ], { cancelable: true, onDismiss: () => resolve(false) }));
}

function useUpdateState() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [feedback, setFeedback] = useState<Feedback>();
  const [progress, setProgress] = useState<number>();
  const [language, setLanguage] = useState<Language>('sv');
  const running = useRef(false);
  const cancelled = useRef(false);
  const download = useRef<ReturnType<typeof createDownloadResumable> | undefined>(undefined);

  const cancel = useCallback(() => {
    if (!download.current) return;
    cancelled.current = true;
    void download.current.cancelAsync().catch(() => {});
  }, []);

  const check = useCallback(async (requestedLanguage: Language, manual = false) => {
    if (isPlayBuild) {
      if (manual) {
        try { await Linking.openURL('https://play.google.com/store/apps/details?id=se.minnetrail.app'); }
        catch { setFeedback('updateError'); }
      }
      return;
    }
    if (running.current) return;
    if (Platform.OS !== 'android') {
      if (manual) setFeedback('updateAndroidOnly');
      return;
    }
    running.current = true;
    cancelled.current = false;
    setLanguage(requestedLanguage);
    setFeedback(undefined);
    setProgress(undefined);
    setPhase('checking');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let file: File | undefined;
    let installerOpened = false;
    try {
      const installed = Constants.expoConfig?.version;
      if (!installed) throw new Error('Installed version missing');
      const release = await fetchJSON(latestReleaseUrl, controller.signal);
      const apk = availableAPK(installed, release);
      if (!apk) {
        if (manual) {
          const tags = await fetchJSON(latestTagsUrl, controller.signal);
          setFeedback(newerVersion(installed, tags) ? 'updatePending' : 'updateCurrent');
        }
        return;
      }
      clearTimeout(timeout);
      if (!await confirmDownload(requestedLanguage, apk)) return;
      const directory = new Directory(Paths.cache, 'app-updates');
      directory.create({ idempotent: true, intermediates: true });
      file = new File(directory, apk.filename);
      if (file.exists) file.delete();
      setPhase('downloading');
      download.current = createDownloadResumable(apk.url, file.uri, {}, data => {
        setProgress(data.totalBytesExpectedToWrite > 0
          ? Math.min(1, data.totalBytesWritten / data.totalBytesExpectedToWrite) : undefined);
      });
      const result = await download.current.downloadAsync();
      download.current = undefined;
      if (cancelled.current) return;
      if (!result || result.status !== 200 || file.size !== apk.size) throw new Error('Invalid APK download');
      setPhase('verifying');
      const hash = await digest(CryptoDigestAlgorithm.SHA256, await file.bytes());
      const actual = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
      if (actual !== apk.sha256) throw new Error('Invalid APK checksum');
      setPhase('installing');
      await startActivityAsync('android.intent.action.VIEW', {
        data: await getContentUriAsync(file.uri),
        type: 'application/vnd.android.package-archive',
        flags: 1,
      });
      // Android can still be reading this URI after the intent promise resolves.
      installerOpened = true;
    } catch {
      if (!cancelled.current) {
        setFeedback('updateError');
        if (!manual && file) Alert.alert(copy[requestedLanguage].updateError);
      }
    } finally {
      clearTimeout(timeout);
      if (file && !installerOpened && file.exists) {
        try { file.delete(); } catch { /* A later download can replace the incomplete cache file. */ }
      }
      if (cancelled.current) setFeedback('updateCancelled');
      download.current = undefined;
      running.current = false;
      setPhase('idle');
    }
  }, []);

  return { phase, feedback, progress, language, check, cancel };
}

const UpdatesContext = createContext<ReturnType<typeof useUpdateState> | null>(null);

export function useUpdates() {
  const updates = useContext(UpdatesContext);
  if (!updates) throw new Error('UpdatesProvider is required');
  return updates;
}

export function UpdatesProvider({ children }: { children: ReactNode }) {
  const updates = useUpdateState();
  const t = copy[updates.language];
  const downloading = updates.phase === 'downloading';
  const visible = downloading || updates.phase === 'verifying' || updates.phase === 'installing';
  const title = downloading ? t.downloadingUpdate : updates.phase === 'verifying' ? t.verifyingUpdate : t.installingUpdate;
  return (
    <UpdatesContext.Provider value={updates}>
      {children}
      <Modal transparent visible={visible} animationType="fade" onRequestClose={downloading ? updates.cancel : () => {}}>
        <View style={{ flex: 1, backgroundColor: '#173D30A0', justifyContent: 'center', padding: 24 }}>
          <View style={[styles.card, { width: '100%', maxWidth: 480, alignSelf: 'center' }]}>
            <Text accessibilityRole="header" style={styles.heading}>{title}</Text>
            {downloading && updates.progress !== undefined ? <>
              <Text accessibilityLiveRegion="polite" style={styles.body}>{Math.round(updates.progress * 100)} %</Text>
              <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(updates.progress * 100) }}
                style={{ height: 12, borderRadius: 8, backgroundColor: colors.paleGreen, overflow: 'hidden' }}>
                <View style={{ width: `${updates.progress * 100}%`, height: '100%', backgroundColor: colors.forest }} />
              </View>
            </> : <ActivityIndicator size="large" color={colors.forest} />}
            {downloading && <Button title={t.cancel} icon="close" tone="quiet" onPress={updates.cancel} />}
          </View>
        </View>
      </Modal>
    </UpdatesContext.Provider>
  );
}

export function useStartupUpdate(ready: boolean, language: Language) {
  const { check } = useUpdates();
  const currentLanguage = useRef(language);
  useEffect(() => { currentLanguage.current = language; }, [language]);
  useEffect(() => {
    if (ready && !isPlayBuild) void check(currentLanguage.current);
  }, [ready, check]);
}
