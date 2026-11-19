import Constants from 'expo-constants';
import { useEffect, useRef } from 'react';
import { Alert, Linking } from 'react-native';
import type { Language } from './missions';
import { copy } from './text';
import { newerVersion } from './update-versions';

const repo = 'tdavor/Vastkustbus';
const tagsUrl = `https://api.github.com/repos/${repo}/tags?per_page=100`;
const releasesUrl = `https://github.com/${repo}/releases`;

export function useStartupUpdate(ready: boolean, language: Language) {
  const currentLanguage = useRef(language);
  useEffect(() => { currentLanguage.current = language; }, [language]);

  useEffect(() => {
    const installed = Constants.expoConfig?.version;
    if (!ready || !installed) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    async function check(version: string) {
      try {
        const response = await fetch(tagsUrl, {
          signal: controller.signal,
          headers: { Accept: 'application/vnd.github+json' },
        });
        if (!response.ok) return;
        const latest = newerVersion(version, await response.json());
        if (!latest || controller.signal.aborted) return;
        const t = copy[currentLanguage.current];
        Alert.alert(t.updateTitle, t.updateMessage.replace('{version}', latest), [
          { text: t.cancel, style: 'cancel' },
          { text: t.viewUpdate, onPress: () => { void Linking.openURL(releasesUrl).catch(() => {}); } },
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
