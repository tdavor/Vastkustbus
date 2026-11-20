import Constants from 'expo-constants';
import { CryptoDigestAlgorithm, digest } from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import { downloadAsync, getContentUriAsync } from 'expo-file-system/legacy';
import { startActivityAsync } from 'expo-intent-launcher';
import { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import type { Language } from './missions';
import { copy } from './text';
import { availableAPK, latestReleaseUrl } from './update-versions';

const apkType = 'application/vnd.android.package-archive';

async function downloadAndOpen(apk: NonNullable<ReturnType<typeof availableAPK>>) {
  const file = new File(Paths.cache, apk.filename);
  try {
    const result = await downloadAsync(apk.url, file.uri);
    if (result.status !== 200 || file.size !== apk.size) throw new Error('Invalid APK download');
    const hash = await digest(CryptoDigestAlgorithm.SHA256, await file.bytes());
    const actual = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
    if (actual !== apk.sha256) throw new Error('Invalid APK checksum');

    await startActivityAsync('android.intent.action.VIEW', {
      data: await getContentUriAsync(file.uri),
      type: apkType,
      flags: 1, // Android FLAG_GRANT_READ_URI_PERMISSION.
    });
  } finally {
    if (file.exists) file.delete();
  }
}

export function useStartupUpdate(ready: boolean, language: Language) {
  const currentLanguage = useRef(language);
  useEffect(() => { currentLanguage.current = language; }, [language]);

  useEffect(() => {
    const installed = Constants.expoConfig?.version;
    if (!ready || !installed || Platform.OS !== 'android') return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    async function check(version: string) {
      try {
        const response = await fetch(latestReleaseUrl, {
          signal: controller.signal,
          headers: { Accept: 'application/vnd.github+json' },
        });
        if (!response.ok) return;
        const apk = availableAPK(version, await response.json());
        if (!apk || controller.signal.aborted) return;
        const t = copy[currentLanguage.current];
        Alert.alert(t.updateTitle, t.updateMessage.replace('{version}', apk.version), [
          { text: t.cancel, style: 'cancel' },
          { text: t.downloadUpdate, onPress: () => {
            void downloadAndOpen(apk).catch(() => Alert.alert(copy[currentLanguage.current].updateError));
          } },
        ], { cancelable: true });
      } catch {
        // Offline launches and temporary GitHub failures do not interrupt the app.
      } finally {
        clearTimeout(timeout);
      }
    }

    void check(installed);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [ready]);
}
