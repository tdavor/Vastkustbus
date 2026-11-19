import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { dateLabel, MemoryPhoto, placeLabel } from '../src/memory';
import { missions } from '../src/missions';
import { useJournal } from '../src/store';
import { rewardsCopy } from '../src/rewards';
import { copy } from '../src/text';
import { Button, Page, styles } from '../src/ui';

export default function MemoryBook() {
  const { journal: { language, memories, rewards } } = useJournal();
  const t = copy[language];
  const sorted = [...memories].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Page>
      <Button title={t.back} icon="arrow-back" tone="quiet" onPress={() => router.back()} />
      <Text style={styles.title}>{t.book}</Text>
      {rewards.unlocked.includes(300) && <Button title={rewardsCopy[language].slideshow} icon="images-outline"
        disabled={!memories.length} tone="yellow" onPress={() => router.push('/slideshow')} />}
      {!sorted.length ? <View style={styles.card}><Text style={styles.body}>{t.empty}</Text></View> : <>
        <Text style={styles.small}>{t.archiveSubtitle}</Text>
        {sorted.map(memory => (
          <Pressable key={memory.id} style={styles.card} accessibilityRole="button"
            onPress={() => router.push({ pathname: '/memory/[id]', params: { id: memory.id } })}>
            <MemoryPhoto memory={memory} language={language} />
            <Text style={styles.heading}>{missions.find(item => item.id === memory.missionId)?.title[language] ?? t.mission}</Text>
            <Text style={styles.small}>{dateLabel(memory, language)} · {placeLabel(memory, language) ?? t.noPlace}</Text>
          </Pressable>
        ))}
      </>}
    </Page>
  );
}
