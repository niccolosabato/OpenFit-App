/**
 * Presentazione al primo avvio.
 *
 * Prima di questa schermata la prima cosa che l'app diceva a un utente nuovo
 * era una schermata Oggi vuota: nessun nome, nessuna unità di misura scelta,
 * nessuna idea di cosa fare. Qui si chiede il minimo che serve a far sembrare
 * l'app già propria — e ogni passo si può saltare, perché niente di ciò che si
 * chiede qui è indispensabile e tutto resta modificabile dal profilo.
 *
 * Non è una rotta: vive sotto `features/` di proposito, perché dentro
 * `src/app/` expo-router la trasformerebbe in una pagina raggiungibile a mano.
 * La monta `_layout.tsx` al posto dello stack finché `onboardingCompleted` è
 * falso.
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { NumberStepper } from '@/components/ui/number-stepper';
import { ProgressBar } from '@/components/ui/progress';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { saveMeasurement } from '@/db/queries/body';
import { updateSettings } from '@/db/queries/settings';
import type { WeightUnit } from '@/db/enums';
import { formatDayKey } from '@/lib/format';
import { toKg, UNIT_LABEL, WEIGHT_STEP } from '@/lib/units';
import { useSettings } from '@/store/settings';
import { ACCENTS, ACCENT_LABELS, capsule, useTheme, type AccentKey } from '@/theme';

const STEPS = 5;

export function OnboardingFlow() {
  const theme = useTheme();
  const { settings, update } = useSettings();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<WeightUnit>(settings.unit);
  const [weight, setWeight] = useState<number | null>(null);
  const [heightCm, setHeightCm] = useState<number | null>(null);

  /** Scrive tutto in un colpo solo e sblocca l'app. */
  function finish() {
    updateSettings({
      userName: name.trim() || null,
      unit,
      heightCm,
      onboardingCompleted: true,
    });

    // Il peso non sta nelle impostazioni ma fra le misurazioni, e come ogni
    // carico nel database va salvato in kg: l'unità dell'utente è solo
    // presentazione.
    if (weight !== null) {
      saveMeasurement(formatDayKey(new Date()), { weight: toKg(weight, unit) });
    }
  }

  /** Chiude la presentazione senza registrare nulla di quanto compilato. */
  function skip() {
    updateSettings({ onboardingCompleted: true });
  }

  const isLast = step === STEPS - 1;

  return (
    <Screen
      padded={false}
      actionBar={
        <ActionBar>
          {step > 0 ? (
            <Button title="Indietro" variant="ghost" onPress={() => setStep((s) => s - 1)} />
          ) : null}
          <View style={{ flex: 1 }}>
            <Button
              title={isLast ? 'Comincia' : 'Avanti'}
              size="lg"
              fullWidth
              onPress={() => (isLast ? finish() : setStep((s) => s + 1))}
            />
          </View>
        </ActionBar>
      }>
      <ScreenScroll gap={theme.space.xxl} keyboardShouldPersistTaps="handled">
        {/* Una barra sola invece di cinque trattini: dice quanto manca senza
            far contare i segmenti. */}
        <View style={{ gap: theme.space.sm, marginBottom: theme.space.sm }}>
          <ProgressBar value={(step + 1) / STEPS} height={4} />
          <Text variant="label" tone="faint">
            Passo {step + 1} di {STEPS}
          </Text>
        </View>

        {/* La chiave rimonta il blocco a ogni passo: senza, il testo cambierebbe
            sotto senza che nulla dica che si è passati oltre. */}
        <Animated.View key={step} entering={FadeInDown.duration(theme.motion.duration.slow)}>
          {step === 0 ? (
            <Step
              title="Benvenuto in OpenFit"
              body="Un diario di allenamento per la sala pesi. I tuoi dati restano su questo telefono: nessun account, nessun server, nessuna sincronizzazione."
              icon="dumbbell"
            />
          ) : null}

          {step === 1 ? (
            <Step title="Come ti chiami?" body="Serve solo per il saluto sulla schermata di apertura.">
              <TextField
                label="Nome"
                value={name}
                onChangeText={setName}
                placeholder="Il tuo nome"
                autoFocus
                hint="Puoi lasciarlo vuoto."
              />
            </Step>
          ) : null}

          {step === 2 ? (
            <Step
              title="In che unità pesi?"
              body="Si può cambiare quando vuoi: i dati non si perdono, cambia solo come li vedi.">
              <View style={[styles.units, { gap: theme.space.md }]}>
                {(['kg', 'lb'] as const).map((option) => (
                  <View key={option} style={{ flex: 1 }}>
                    <Button
                      title={UNIT_LABEL[option]}
                      variant={unit === option ? 'primary' : 'secondary'}
                      size="lg"
                      fullWidth
                      onPress={() => setUnit(option)}
                    />
                  </View>
                ))}
              </View>
            </Step>
          ) : null}

          {step === 3 ? (
            <Step title="Scegli un colore" body="Tocca per vedere subito come cambia l'app.">
              <View style={[styles.accents, { rowGap: theme.space.lg }]}>
                {(Object.keys(ACCENTS) as AccentKey[]).map((key) => (
                  <AccentSwatch
                    key={key}
                    accentKey={key}
                    // Si scrive subito nel database: il tema legge l'accento da
                    // lì, ed è l'unico modo di far vedere l'anteprima dal vivo.
                    selected={settings.accent === key}
                    onPress={() => update({ accent: key })}
                  />
                ))}
              </View>
            </Step>
          ) : null}

          {step === 4 ? (
            <Step
              title="Peso e altezza"
              body="Servono solo ai grafici dell'andamento. Lasciali vuoti se preferisci: si mettono anche dopo, dal profilo.">
              <NumberStepper
                label="Peso"
                value={weight}
                onChange={setWeight}
                step={WEIGHT_STEP[unit]}
                min={0}
                suffix={UNIT_LABEL[unit]}
                allowEmpty
              />
              <NumberStepper
                label="Altezza"
                value={heightCm}
                onChange={setHeightCm}
                step={1}
                min={100}
                max={250}
                suffix="cm"
                allowEmpty
              />
            </Step>
          ) : null}
        </Animated.View>

        {/* Non all'ultimo passo: lì "Comincia" salva quello che si è scritto e
            "Salta" lo butterebbe via, che a un passo dalla fine è solo un modo
            per perdere il lavoro appena fatto. */}
        {!isLast ? (
          <View style={styles.centered}>
            <Button title="Salta la presentazione" variant="ghost" onPress={skip} />
          </View>
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}

function Step({
  title,
  body,
  icon,
  children,
}: {
  title: string;
  body: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  children?: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.xl }}>
      {icon ? (
        <Animated.View
          entering={FadeIn.duration(theme.motion.duration.slow)}
          style={[styles.halo, { backgroundColor: theme.colors.accentHalo }]}>
          <Surface level="mid" radius={capsule(BADGE)} style={styles.badge}>
            <MaterialCommunityIcons name={icon} size={40} color={theme.colors.accent} />
          </Surface>
        </Animated.View>
      ) : null}

      <View style={{ gap: theme.space.md }}>
        <Text variant="title">{title}</Text>
        <Text
          variant="body"
          tone="dim"
          style={{ lineHeight: theme.font.size.md * theme.font.lineHeight.normal }}>
          {body}
        </Text>
      </View>

      <View style={{ gap: theme.space.lg }}>{children}</View>
    </View>
  );
}

/**
 * Il colore, come colore.
 *
 * Erano bottoni con scritto "Smeraldo" e un puntino: si sceglieva leggendo un
 * nome invece di guardare una tinta, che è il contrario di come si sceglie un
 * colore.
 */
function AccentSwatch({
  accentKey,
  selected,
  onPress,
}: {
  accentKey: AccentKey;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const accent = ACCENTS[accentKey];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={ACCENT_LABELS[accentKey]}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.swatchCell, pressed && { opacity: 0.7 }]}>
      <View
        style={[
          styles.swatch,
          {
            backgroundColor: accent.base,
            // Il contorno c'è sempre, trasparente quando il colore non è
            // scelto: se comparisse solo alla selezione la pastiglia
            // cambierebbe misura e la griglia ballerebbe.
            borderColor: selected ? theme.colors.text : 'transparent',
          },
        ]}
      />
      <Text variant="caption" tone={selected ? 'default' : 'faint'} numberOfLines={1}>
        {ACCENT_LABELS[accentKey]}
      </Text>
    </Pressable>
  );
}

/** Il disco dell'icona e il suo alone. */
const BADGE = 96;
const HALO = 136;
/** Il tondo di un colore accento. */
const SWATCH = 56;

const styles = StyleSheet.create({
  halo: {
    width: HALO,
    height: HALO,
    borderRadius: capsule(HALO),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: { width: BADGE, height: BADGE, alignItems: 'center', justifyContent: 'center' },
  units: { flexDirection: 'row' },
  accents: { flexDirection: 'row', flexWrap: 'wrap' },
  // Quattro per riga su qualunque schermo: vedi la nota gemella nel profilo.
  // La spaziatura orizzontale sta dentro la cella, non nel `gap`.
  swatchCell: { width: '25%', alignItems: 'center', gap: 8 },
  swatch: { width: SWATCH, height: SWATCH, borderRadius: capsule(SWATCH), borderWidth: 3 },
  centered: { alignItems: 'center' },
});
