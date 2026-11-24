import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { cities, countries } from '../../src/cities';
import { Button, colors, Page, styles } from '../../src/ui';

export default function DiscoverCity() {
  return <Page>
    <Button title="Tillbaka" icon="arrow-back" tone="quiet" onPress={() => router.back()} />
    <View style={styles.row}>
      <Ionicons name="compass-outline" size={36} color={colors.forest} accessible={false} />
      <Text accessibilityRole="header" style={[styles.title, { flex: 1 }]}>Lär känna din stad</Text>
    </View>
    <Text style={styles.body}>Välj ett land och sedan en stad. Upptäck kända platser med små uppdrag för dig och din vuxen!</Text>
    {countries.map(country => <View key={country.id} style={[styles.card, { backgroundColor: country.color }]}>
      <Text accessibilityRole="header" style={styles.heading}>{country.name}</Text>
      <Text style={styles.body}>{country.description}</Text>
      <Text style={styles.small}>Städer att upptäcka: {cities.filter(city => city.countryId === country.id).length}</Text>
      <Button title={'Upptäck ' + country.name} icon={country.icon} onPress={() => router.push({ pathname: '/discover-city/[countryId]', params: { countryId: country.id } })} />
    </View>)}
  </Page>;
}
