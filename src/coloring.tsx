import { File } from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import WebView from 'react-native-webview';
import { coloringHTML } from './coloring-algorithm';
import { photoFile } from './store';

export type ColoringResult = { base64: string; width: number; height: number };

export function coloringFile(photo: string, detailed: boolean) {
  return photoFile('coloring-v1-' + (detailed ? 'detailed-' : 'simple-') + encodeURIComponent(photo) + '.png');
}

export function saveColoring(photo: string, detailed: boolean, result: ColoringResult) {
  const destination = coloringFile(photo, detailed);
  const temporary = photoFile(destination.name + '.tmp');
  try {
    temporary.create({ overwrite: true });
    temporary.write(result.base64, { encoding: 'base64' });
    if (destination.exists) temporary.delete();
    else temporary.move(destination);
    return destination.uri;
  } catch (error) {
    if (temporary.exists) temporary.delete();
    throw error;
  }
}

export function ColoringProcessor({ source, detailed, onComplete, onError }: {
  source: string; detailed: boolean; onComplete: (result: ColoringResult) => void; onError: () => void;
}) {
  const [html, setHTML] = useState<string>();
  const callbacks = useRef({ onComplete, onError });
  const finished = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  callbacks.current = { onComplete, onError };

  function fail() {
    if (finished.current) return;
    finished.current = true;
    clearTimeout(timeout.current);
    callbacks.current.onError();
  }

  useEffect(() => {
    finished.current = false;
    timeout.current = setTimeout(fail, 45000);
    const file = new File(source);
    if (!file.exists || file.size > 40 * 1024 * 1024) fail();
    else void file.base64().then(data => {
      if (!finished.current) setHTML(coloringHTML(data, detailed));
    }).catch(fail);
    return () => {
      finished.current = true;
      clearTimeout(timeout.current);
    };
  }, [source, detailed]);

  if (!html) return null;
  return <WebView source={{ html, baseUrl: 'about:blank' }}
    originWhitelist={['about:blank']} javaScriptEnabled domStorageEnabled={false}
    allowFileAccess={false} allowFileAccessFromFileURLs={false} allowUniversalAccessFromFileURLs={false}
    setSupportMultipleWindows={false} mixedContentMode="never"
    onShouldStartLoadWithRequest={request => request.url === 'about:blank'}
    onError={fail} onContentProcessDidTerminate={fail} onRenderProcessGone={fail}
    onMessage={event => {
      if (finished.current) return;
      try {
        const result = JSON.parse(event.nativeEvent.data);
        if (result.error || typeof result.image !== 'string' || result.image.length > 12 * 1024 * 1024
          || !Number.isInteger(result.width) || result.width < 8 || result.width > 1600
          || !Number.isInteger(result.height) || result.height < 8 || result.height > 1600) throw new Error('Invalid outline');
        const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(result.image);
        if (!match) throw new Error('Invalid outline image');
        finished.current = true;
        clearTimeout(timeout.current);
        callbacks.current.onComplete({ base64: match[1], width: result.width, height: result.height });
      } catch { fail(); }
    }}
    accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none"
    style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />;
}
