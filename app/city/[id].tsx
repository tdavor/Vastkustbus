import { guideCopy } from '../../src/city-copy';
import { useJournal } from '../../src/store';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { cities } from '../../src/cities';
import { CityGuide } from '../../src/city-guide';
import { Button, Page, styles } from '../../src/ui';

export default function CityPage() {
  const { journal } = useJournal();
  const t = guideCopy[journal.language];
  const { id } = useLocalSearchParams<{ id: string }>();
  const city = cities.find(item => item.id === id);
  if (city) return <CityGuide key={city.id} city={city} />;
  return <Page>
    <Button title={t.back} icon="arrow-back" tone="quiet" onPress={() => router.back()} />
    <Text style={styles.heading}>{t.cityMissing}</Text>
  </Page>;
}
