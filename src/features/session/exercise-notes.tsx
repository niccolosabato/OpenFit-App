import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { TextField } from '@/components/ui/field';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

/**
 * Il diario di un esercizio in sessione.
 *
 * Sopra, la nota tecnica della scheda in sola lettura: è il promemoria con cui
 * si è arrivati all'esercizio e non si tocca da qui. Sotto, il campo in cui si
 * appunta cosa è successo davvero. Sono due cose distinte — la prima si scrive
 * prima, la seconda durante — e restano separate anche visivamente.
 *
 * La bozza vive in locale e si consolida alla perdita del fuoco: scrivere sul
 * database a ogni tasto farebbe rientrare la live query e porterebbe via quello
 * che si sta digitando.
 */
export function ExerciseNotesField({
  technicalNote,
  value,
  onSave,
}: {
  technicalNote: string | null;
  value: string | null;
  onSave: (notes: string | null) => void;
}) {
  const theme = useTheme();
  const [draft, setDraft] = useState(value ?? '');
  const focusedRef = useRef(false);

  useEffect(() => {
    if (focusedRef.current) return;
    setDraft(value ?? '');
  }, [value]);

  // Ultimo valore consolidato e ultima bozza, per riconoscere il cambiamento
  // allo smontaggio. Un `TextInput` a fuoco che viene smontato — succede
  // premendo "Salva modifiche" con la tastiera aperta — **non** emette
  // `onBlur`, quindi la bozza non passerebbe mai dal blur al database.
  const savedRef = useRef(value);
  const draftRef = useRef(draft);
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    savedRef.current = value;
  }, [value]);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    return () => {
      const next = draftRef.current.trim() || null;
      if (next !== savedRef.current) onSaveRef.current(next);
    };
  }, []);

  return (
    <View
      style={[
        styles.block,
        {
          padding: theme.space.md,
          gap: theme.space.sm,
          borderTopColor: theme.colors.border,
        },
      ]}>
      {technicalNote ? (
        <View style={{ gap: theme.space.xs }}>
          <Text variant="label" tone="faint">
            Nota della scheda
          </Text>
          <Text variant="caption" tone="dim" numberOfLines={3}>
            {technicalNote}
          </Text>
        </View>
      ) : null}
      <TextField
        label="Note"
        value={draft}
        onChangeText={setDraft}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onBlur={() => {
          focusedRef.current = false;
          onSave(draft.trim() || null);
        }}
        placeholder="Come è andato questo esercizio…"
        multiline
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { borderTopWidth: StyleSheet.hairlineWidth },
});
