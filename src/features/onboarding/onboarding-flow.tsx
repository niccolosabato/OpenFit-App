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
import { StyleSheet, View } from 'react-native';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Surface } from '@/components/ui/surface';
import { NumberStepper } from '@/components/ui/number-stepper';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { saveMeasurement } from '@/db/queries/body';
import { updateSettings } from '@/db/queries/settings';
import type { WeightUnit } from '@/db/enums';
import { formatDayKey } from '@/lib/format';
import { toKg, UNIT_LABEL, WEIGHT_STEP } from '@/lib/units';
import { useSettings } from '@/store/settings';
import { ACCENTS, ACCENT_LABELS, useTheme, type AccentKey } from '@/theme';

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
      <ScreenScroll gap={theme.space.xl} keyboardShouldPersistTaps="handled">
        <View style={[styles.progress, { gap: 6, marginBottom: theme.space.sm }]}>
          {Array.from({ length: STEPS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.tick,
                {
                  backgroundColor: i <= step ? theme.colors.accent : theme.colors.surface2,
                  borderRadius: 2,
                },
              ]}
            />
          ))}
        </View>

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
          <Step title="In che unità pesi?" body="Si può cambiare quando vuoi: i dati non si perdono, cambia solo come li vedi.">
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
            <View style={[styles.accents, { rowGap: theme.space.sm }]}>
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

        {/* Non all'ultimo passo: lì "Comincia" salva quello che si è scritto e
            "Salta" lo butterebbe via, che a un passo dalla fine è solo un modo
            per perdere il lavoro appena fatto. */}
        {!isLast ? (
          <View style={{ alignItems: 'center', paddingTop: theme.space.sm }}>
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
    <View style={{ gap: theme.space.lg }}>
      {icon ? (
        <Surface level="mid" radius={48} style={styles.badge}>
          <MaterialCommunityIcons name={icon} size={40} color={theme.colors.accent} />
        </Surface>
      ) : null}
      <View style={{ gap: theme.space.sm }}>
        <Text variant="title">{title}</Text>
        <Text variant="body" tone="dim" style={{ lineHeight: 22 }}>
          {body}
        </Text>
      </View>
      {children}
    </View>
  );
}

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
    <View style={styles.swatchCell}>
      <Button
        title={ACCENT_LABELS[accentKey]}
        variant={selected ? 'primary' : 'secondary'}
        size="lg"
        fullWidth
        onPress={onPress}
        icon={
          <View
            style={[
              styles.dot,
              { backgroundColor: accent.base, borderColor: theme.colors.borderStrong },
            ]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row' },
  tick: { flex: 1, height: 3 },
  badge: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  units: { flexDirection: 'row' },
  accents: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  // Due colonne esatte: con `flexGrow` l'ultima riga si allargava e i colori
  // non stavano più incolonnati con quelli sopra.
  swatchCell: { width: '48%' },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: StyleSheet.hairlineWidth * 2 },
});
