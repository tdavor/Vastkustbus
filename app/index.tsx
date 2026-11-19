import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { avatars, levelFor, type Avatar } from '../src/missions';
import { useJournal } from '../src/store';
import { appName, copy } from '../src/text';
import { milestones, rewardsCopy } from '../src/rewards';
import { Animal, ExplorerAvatar, Button, Chip, colors, Page, styles } from '../src/ui';

export default function Home() {
  const { journal, xp, setLanguage, setProfile } = useJournal();
  const { language, profile } = journal;
  const t = copy[language];
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<Avatar>('moose');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const r = rewardsCopy[language];
  const next = milestones.find(mark => xp < mark);
  const previous = [...milestones].reverse().find(mark => xp >= mark) ?? 0;
  const goal = next ?? 1500;
  const progress = next ? (xp - previous) / (next - previous) : 1;
  async function apply(action: () => Promise<void>) {
    setBusy(true);
    setError(false);
    try { await action(); } catch { setError(true); } finally { setBusy(false); }
  }

  return (
    <Page>
      <View style={styles.row}>
        <Ionicons name="compass" size={27} color={colors.forest} />
        <Text style={styles.brand}>{appName}</Text>
      </View>
      {profile ? <>
        <View style={[styles.card, { backgroundColor: colors.paleGreen }]}>
          <View style={styles.row}>
            <ExplorerAvatar avatar={profile.avatar} rewards={journal.rewards} size={80} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{profile.name}</Text>
              <Text style={styles.body}>{t.level} {levelFor(xp)} · {xp} XP</Text>
            </View>
          </View>
          <View accessibilityRole="progressbar" accessibilityLabel={r.next}
            accessibilityValue={{ min: next ? previous : 1000, max: goal, now: Math.min(xp, goal) }}
            style={{ height: 12, borderRadius: 8, backgroundColor: colors.white, overflow: 'hidden' }}>
            <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: colors.forest }} />
          </View>
          <Text style={styles.small}>{next ? `${r.next} · ${xp} / ${next} XP` : r.all}</Text>
        </View>
        <Button title={r.chest} icon="gift-outline" tone="yellow" onPress={() => router.push('/rewards')} />
        <Button title={t.start} icon="compass-outline" tone="yellow" onPress={() => router.push('/mission')} />
        <Button title={t.book} icon="book-outline" onPress={() => router.push('/book')} />
      </> : <>
        <Text style={styles.title}>{t.welcome}</Text>
        <Text style={styles.body}>{t.intro}</Text>
        <Text style={styles.small}>{t.name}</Text>
        <TextInput style={styles.input} accessibilityLabel={t.name} value={name} onChangeText={setName} maxLength={32} />
        <Text style={styles.heading}>{t.avatar}</Text>
        <View style={[styles.row, { alignItems: 'stretch' }]}>
          {(Object.keys(avatars) as Avatar[]).map(item => (
            <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === avatar }}
              onPress={() => setAvatar(item)} style={[styles.card, {
                width: '48%', alignItems: 'center', padding: 9,
                backgroundColor: item === avatar ? colors.paleGreen : colors.white,
                borderColor: item === avatar ? colors.forest : colors.line,
              }]}>
              <Animal avatar={item} size={60} />
              <Text style={styles.small}>{avatars[item][language]}</Text>
            </Pressable>
          ))}
        </View>
        <Button title={t.begin} icon="arrow-forward" disabled={!name.trim() || busy}
          onPress={() => { void apply(() => setProfile({ name: name.trim(), avatar })); }} />
      </>}
      <View accessibilityLabel={t.language} style={styles.row}>
        <Ionicons name="language" size={22} color={colors.forest} />
        <Chip label="Svenska" selected={language === 'sv'} onPress={() => { if (!busy) void apply(() => setLanguage('sv')); }} />
        <Chip label="English" selected={language === 'en'} onPress={() => { if (!busy) void apply(() => setLanguage('en')); }} />
      </View>
      {error && <Text accessibilityRole="alert" style={styles.error}>{t.saveError}</Text>}
    </Page>
  );
}
