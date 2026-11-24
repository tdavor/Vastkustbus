import { guideCopy, localizeCountry } from '../../src/city-copy';
import { useJournal } from '../../src/store';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { cities, countries } from '../../src/cities';
import { Button, colors, Page, styles } from '../../src/ui';

export default function DiscoverCity() {
  const { journal } = useJournal();
  const t = guideCopy[journal.language];
  return <Page>
    <Button title={t.back} icon="arrow-back" tone="quiet" onPress={() => router.back()} />
    <View style={styles.row}>
      <Ionicons name="compass-outline" size={36} color={colors.forest} accessible={false} />
      <Text accessibilityRole="header" style={[styles.title, { flex: 1 }]}>{t.title}</Text>
    </View>
    <Text style={styles.body}>{t.intro}</Text>
    {countries.map(item => localizeCountry(item, journal.language)).map(country => <View key={country.id} style={[styles.card, { backgroundColor: country.color }]}>
      <Text accessibilityRole="header" style={styles.heading}>{country.name}</Text>
      <Text style={styles.body}>{country.description}</Text>
      <Text style={styles.small}>{t.citiesAvailable(cities.filter(city => city.countryId === country.id).length)}</Text>
      <Button title={t.discover(country.name)} icon={country.icon} onPress={() => router.push({ pathname: '/discover-city/[countryId]', params: { countryId: country.id } })} />
    </View>)}
  </Page>;
}
