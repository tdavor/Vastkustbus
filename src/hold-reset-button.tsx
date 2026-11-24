import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { createHold } from './hold-to-confirm';
import { colors, styles } from './ui';

export function HoldResetButton({ title, hint, disabled, onComplete }: {
  title: string; hint: string; disabled: boolean; onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const callback = useRef(onComplete);
  callback.current = onComplete;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const [hold] = useState(() => createHold(() => {
    if (!disabledRef.current && AppState.currentState === 'active') callback.current();
  }, setProgress));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', () => hold.cancel());
    return () => { subscription.remove(); hold.cancel(); };
  }, [hold]);
  useEffect(() => { if (disabled) hold.cancel(); }, [disabled, hold]);
  return <View style={{ gap: 6 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityHint={hint}
      accessibilityState={{ disabled }} disabled={disabled}
      onPressIn={() => { if (!disabledRef.current && AppState.currentState === 'active') hold.begin(); }}
      onPressOut={hold.cancel}
      style={({ pressed }) => [styles.button, styles.quiet, { overflow: 'hidden', borderWidth: 1, borderColor: colors.danger }, (pressed || disabled) && styles.faded]}>
      <View accessible={false} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progress * 100}%`, backgroundColor: '#F2C9C5' }} />
      <Ionicons name="refresh-outline" size={22} color={colors.danger} />
      <Text style={[styles.buttonText, { color: colors.danger }]}>{title}</Text>
    </Pressable>
    <Text style={styles.small}>{hint}</Text>
  </View>;
}
