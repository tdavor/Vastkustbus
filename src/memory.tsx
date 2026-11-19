import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { quickTags, type Language } from './missions';
import { photoFile, type Memory } from './store';
import { copy } from './text';
import { styles } from './ui';

export function placeLabel(memory: Memory, language: Language) {
  const { place } = memory;
  return place ? 'text' in place ? place.text : quickTags[place.tag]?.[language] : undefined;
}

export function dateLabel(memory: Memory, language: Language) {
  return new Date(memory.date).toLocaleDateString(language === 'sv' ? 'sv-SE' : 'en-GB', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function MemoryPhoto({ memory, language, onLoaded }: {
  memory: Memory; language: Language; onLoaded?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const t = copy[language];
  if (failed) return <View style={[styles.image, { justifyContent: 'center', padding: 12 }]}>
    <Text style={styles.small}>{t.photoError}</Text>
  </View>;
  return <Image source={{ uri: photoFile(memory.photo).uri }} style={styles.image}
    accessibilityLabel={t.photo} onLoad={onLoaded} onError={() => setFailed(true)} />;
}
