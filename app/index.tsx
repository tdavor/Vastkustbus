import { guideCopy } from '../src/city-copy';
import { isPlayBuild, privacyURL } from '../src/distribution';
import { useParentalGate } from '../src/parent-gate';
import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Linking, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { avatars, levelFor, type Avatar } from '../src/missions';
import { useJournal } from '../src/store';
import { appName, copy } from '../src/text';
import { HoldResetButton } from '../src/hold-reset-button';
import { drawingLicense } from '../src/drawing-license';
import { milestones, rewardsCopy } from '../src/rewards';
import { useUpdates } from '../src/updates';
import { Animal, ExplorerAvatar, Button, Chip, colors, Page, styles } from '../src/ui';

const authorEmail = 't.davor@gmail.com';
const supportUrl = 'https://buymeacoffee.com/wjkrddbhyx';

export default function Home() {
  const { authorize, changePIN } = useParentalGate();
  const { journal, xp, setLanguage, addPlayer, selectPlayer, players, activePlayerId, resetGame } = useJournal();
  const { language, profile } = journal;
  const updates = useUpdates();
  const [showDrawingLicense, setShowDrawingLicense] = useState(false);
  const t = copy[language];
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<Avatar>('moose');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<'main' | 'add' | 'about'>();
  const [linkError, setLinkError] = useState(false);
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

  async function openLink(url: string) {
    if (!await authorize('external')) return;
    setLinkError(false);
    void Linking.openURL(url).catch(() => setLinkError(true));
  }

  function backFromSettings() {
    setError(false);
    setLinkError(false);
    setSettings(settings === 'main' ? undefined : 'main');
  }

  function playerFields(inSettings: boolean) {
    return <>
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
      <Button title={inSettings ? t.addPlayer : t.begin} icon="arrow-forward" disabled={!name.trim() || busy}
        onPress={() => void apply(async () => {
          await addPlayer({ name: name.trim(), avatar });
          setName('');
          setAvatar('moose');
          if (inSettings) setSettings(undefined);
        })} />
    </>;
  }

  return (
    <Page>
      <View style={{ borderRadius: 30, overflow: 'hidden', backgroundColor: colors.paleBlue }}>
        <View pointerEvents="none" importantForAccessibility="no-hide-descendants"
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
          <Image source={require('../assets/home-coast.webp')} resizeMode="cover"
            style={{ width: '100%', height: '100%' }} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t.gameSettings}
          onPress={() => { setError(false); setSettings('main'); }}
          style={{ alignSelf: 'flex-end', marginTop: 10, marginRight: 10, borderRadius: 16, width: 48, height: 48,
            alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}>
          <Ionicons name="settings-outline" size={25} color={colors.deep} />
        </Pressable>
        <View style={{ alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 16 }}>
          <Image accessible={false} source={require('../assets/launcher.png')}
            style={{ width: 88, height: 88, borderRadius: 23 }} />
          <Text accessibilityRole="header" style={[styles.title, {
            textAlign: 'center', backgroundColor: colors.cream, borderRadius: 20,
            paddingHorizontal: 14, paddingVertical: 3, overflow: 'hidden',
          }]}>{appName}</Text>
          <View accessible={false} importantForAccessibility="no-hide-descendants"
            style={{ width: '100%', maxWidth: 340, flexDirection: 'row', justifyContent: 'space-evenly' }}>
            {(['moose', 'fox', 'seal', 'puffin'] as const).map((animal, index) => (
              <View key={animal} style={{ padding: 3, borderRadius: 36, backgroundColor: colors.white,
                transform: [{ rotate: index % 2 === 0 ? '-8deg' : '8deg' }] }}>
                <Animal avatar={animal} size={48} />
              </View>
            ))}
          </View>
        </View>
      </View>
      <Modal transparent visible={Boolean(settings)} animationType="fade" onRequestClose={backFromSettings}>
        <View style={{ flex: 1, backgroundColor: '#173D30A0', justifyContent: 'center', padding: 20 }}>
          <View accessibilityViewIsModal style={[styles.card, { width: '100%', maxWidth: 480, maxHeight: '90%', alignSelf: 'center' }]}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
              {settings === 'main' && <>
                <Text accessibilityRole="header" style={styles.heading}>{t.gameSettings}</Text>
                <Text style={styles.body}>{t.language}</Text>
                <View style={styles.row}>
                  <Chip label="Svenska" selected={language === 'sv'} onPress={() => { if (!busy) void apply(() => setLanguage('sv')); }} />
                  <Chip label="English" selected={language === 'en'} onPress={() => { if (!busy) void apply(() => setLanguage('en')); }} />
                </View>
                {players.length > 0 && <>
                  <Text accessibilityRole="header" style={styles.heading}>{t.choosePlayer}</Text>
                  <View style={styles.row}>
                    {players.map(player => (
                      <Chip key={player.id} label={player.profile.name} selected={player.id === activePlayerId}
                        onPress={() => { if (!busy) void apply(async () => {
                          await selectPlayer(player.id);
                          setSettings(undefined);
                        }); }} />
                    ))}
                  </View>
                </>}
                <Button title={t.addPlayer} icon="person-add-outline" tone="quiet" disabled={busy}
                  onPress={() => { setName(''); setAvatar('moose'); setError(false); setSettings('add'); }} />
                <HoldResetButton title={t.resetProgress} hint={t.resetHoldHint} disabled={busy}
                  onComplete={() => Alert.alert(t.resetConfirm, t.resetDetails, [
                    { text: t.cancel, style: 'cancel' },
                    { text: t.resetProgress, style: 'destructive', onPress: () => void apply(async () => {
                      if (!await authorize('settings')) return;
                      await resetGame();
                      setName('');
                      setAvatar('moose');
                      setSettings(undefined);
                      Alert.alert(t.resetDone);
                    }) },
                  ])} />
                <Button title={t.about} icon="information-circle-outline" tone="quiet" onPress={() => setSettings('about')} />
                <Button title="Buy me a coffee" icon="cafe-outline" tone="yellow" onPress={() => openLink(supportUrl)} />
                {isPlayBuild && <Button title={t.parentChangePIN} icon="key-outline" tone="quiet" disabled={busy} onPress={() => { void changePIN(); }} />}
                {linkError && <Text accessibilityRole="alert" style={styles.error}>{t.linkError}</Text>}
              </>}
              {settings === 'add' && <>
                <Text accessibilityRole="header" style={styles.heading}>{t.addPlayer}</Text>
                {playerFields(true)}
              </>}
              {settings === 'about' && <>
                <Text accessibilityRole="header" style={styles.heading}>{t.about} · {appName}</Text>
                <Text style={styles.body}>{t.freeForever}</Text>
                <Text style={styles.body}>{t.appVersion} {Constants.expoConfig?.version ?? '–'}</Text>
                <Button title={isPlayBuild ? t.playUpdates : updates.phase === 'checking' ? t.checkingUpdate : t.checkUpdate}
                  icon="cloud-download-outline" tone="quiet" disabled={updates.phase !== 'idle'}
                  onPress={() => { void (async () => { if (await authorize('external')) await updates.check(language, true); })(); }} />
                {updates.feedback && <Text accessibilityLiveRegion="polite"
                  style={updates.feedback === 'updateError' ? styles.error : styles.small}>{t[updates.feedback]}</Text>}
                <Text style={styles.body}>{t.author} · {authorEmail}</Text>
                <Text style={styles.body}>{t.feedback}</Text>
                <Button title={authorEmail} icon="mail-outline" tone="quiet" onPress={() => openLink(`mailto:${authorEmail}`)} />
                <Button title={t.privacyPolicy} icon="shield-checkmark-outline" tone="quiet" onPress={() => { void openLink(privacyURL); }} />
                <Text style={styles.small}>{t.drawingCredit}</Text>
                <Button title={t.drawingLicense} icon="document-text-outline" tone="quiet"
                  onPress={() => setShowDrawingLicense(previous => !previous)} />
                {showDrawingLicense && <Text selectable style={styles.small}>{drawingLicense}</Text>}
                {linkError && <Text accessibilityRole="alert" style={styles.error}>{t.linkError}</Text>}
              </>}
              {error && <Text accessibilityRole="alert" style={styles.error}>{t.saveError}</Text>}
              <Button title={t.back} icon="arrow-back" onPress={backFromSettings} />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
        <Button title={t.seasonPlaces} icon="leaf-outline" tone="quiet" onPress={() => router.push('/seasonal-places')} />
        <Button title={guideCopy[journal.language].title} icon="compass-outline" tone="quiet" onPress={() => router.push('/discover-city')} />
      </> : <>
        <Text style={styles.title}>{t.welcome}</Text>
        <Text style={styles.body}>{t.intro}</Text>
        {playerFields(false)}
      </>}
      {error && !settings && <Text accessibilityRole="alert" style={styles.error}>{t.saveError}</Text>}
    </Page>
  );
}
