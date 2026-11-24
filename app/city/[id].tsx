import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { cities } from '../../src/cities';
import { CityGuide } from '../../src/city-guide';
import { Button, Page, styles } from '../../src/ui';

export default function CityPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const city = cities.find(item => item.id === id);
  if (city) return <CityGuide key={city.id} city={city} />;
  return <Page>
    <Button title="Tillbaka" icon="arrow-back" tone="quiet" onPress={() => router.back()} />
    <Text style={styles.heading}>Staden hittades inte</Text>
  </Page>;
}
