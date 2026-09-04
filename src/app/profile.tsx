import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { TextField } from '@/components/ui/field';
import { NumberStepper } from '@/components/ui/number-stepper';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { NavRow, SettingsSection, SwitchRow } from '@/components/ui/settings-row';
import { Sheet, SheetAction } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { EFFORT_SCALE_LABELS, type EffortScale, type WeightUnit } from '@/db/enums';
import { wipeAllData } from '@/db/queries/backup';
import { pickAndRestoreBackup, shareBackup } from '@/features/settings/backup-actions';
import { NOTIFICATIONS_AVAILABLE } from '@/features/timer/rest-timer';
import { formatRest } from '@/lib/format';
import { formatWeight, UNIT_LABEL, WEIGHT_STEP } from '@/lib/units';
import { useSettings } from '@/store/settings';
import { ACCENTS, ACCENT_LABELS, useTheme, type AccentKey } from '@/theme';

const EFFORT_SCALES: EffortScale[] = ['rpe', 'rir', 'none'];
const UNITS: WeightUnit[] = ['kg', 'lb'];

export default function ProfileScreen() {
  const theme = useTheme();
  const { settings, update } = useSettings();
  const showToast = useToast((s) => s.show);

  const [identityOpen, setIdentityOpen] = useState(false);
  const [name, setName] = useState(settings.userName ?? '');
  const [restOpen, setRestOpen] = useState(false);
  const [rest, setRest] = useState<number | null>(settings.defaultRestSeconds);
  const [goalOpen, setGoalOpen] = useState(false);
  const [goal, setGoal] = useState<number | null>(settings.weeklySessionGoal);
  const [busy, setBusy] = useState(false);

  async function onExport() {
    setBusy(true);
    try {
      await shareBackup();
    } catch (error) {
      Alert.alert('Backup non riuscito', error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  function onImport() {
    Alert.alert(
      'Ripristinare un backup?',
      'Tutti i dati attuali — schede, storico, record — verranno sostituiti da quelli del file. Esporta prima un backup se vuoi poter tornare indietro.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Scegli il file',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              const result = await pickAndRestoreBackup();
              if (result.cancelled) return;
              showToast('Backup ripristinato', {
                detail: `${result.summary.sessions} allenamenti, ${result.summary.routines} schede, ${result.summary.exercises} esercizi.`,
              });
            } catch (error) {
              Alert.alert(
                'Ripristino non riuscito',
                error instanceof Error ? error.message : String(error),
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  function onReset() {
    Alert.alert(
      'Cancellare tutto?',
      'Schede, allenamenti, record e misurazioni verranno eliminati definitivamente. La libreria esercizi verrà ricaricata al prossimo avvio.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Cancella tutto',
          style: 'destructive',
          onPress: () => {
            wipeAllData();
            showToast('Dati cancellati', { detail: 'Riavvia l’app per ricaricare la libreria.' });
          },
        },
      ],
    );
  }

  return (
    <Screen padded={false} header={<ScreenHeader title="Profilo" showBack />}>

      <ScreenScroll gap={theme.space.xl}>
        <SettingsSection title="Tu">
          <NavRow
            label="Nome"
            value={settings.userName ?? 'non impostato'}
            onPress={() => {
              setName(settings.userName ?? '');
              setIdentityOpen(true);
            }}
          />
          <NavRow
            label="Peso e misure"
            description="Peso corporeo, circonferenze, andamento nel tempo"
            onPress={() => router.push('/body')}
          />
          <NavRow
            label="Obiettivo settimanale"
            value={`${settings.weeklySessionGoal} allenamenti`}
            onPress={() => {
              setGoal(settings.weeklySessionGoal);
              setGoalOpen(true);
            }}
          />
        </SettingsSection>

        <SettingsSection title="Unità e aspetto">
          <View style={{ padding: theme.space.lg, gap: theme.space.lg }}>
            <View style={{ gap: theme.space.sm }}>
              <Text variant="label" tone="dim">
                Unità di misura
              </Text>
              <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
                {UNITS.map((unit) => (
                  <Chip
                    key={unit}
                    label={UNIT_LABEL[unit]}
                    compact
                    selected={settings.unit === unit}
                    onPress={() => update({ unit })}
                  />
                ))}
              </View>
              <Text variant="caption" tone="faint">
                I carichi sono sempre salvati in chilogrammi: cambiare unità non
                altera lo storico.
              </Text>
            </View>

            <View style={{ gap: theme.space.sm }}>
              <Text variant="label" tone="dim">
                Colore accento
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
                {(Object.keys(ACCENTS) as AccentKey[]).map((key) => (
                  <Chip
                    key={key}
                    label={ACCENT_LABELS[key]}
                    compact
                    selected={settings.accent === key}
                    onPress={() => update({ accent: key })}
                  />
                ))}
              </View>
            </View>
          </View>
        </SettingsSection>

        <SettingsSection title="Allenamento">
          <NavRow
            label="Recupero predefinito"
            value={formatRest(settings.defaultRestSeconds)}
            onPress={() => {
              setRest(settings.defaultRestSeconds);
              setRestOpen(true);
            }}
          />
          <SwitchRow
            label="Avvia il timer da solo"
            description="Parte appena spunti una serie."
            value={settings.autoStartTimer}
            onChange={(autoStartTimer) => update({ autoStartTimer })}
          />
          <SwitchRow
            label="Notifica a fine recupero"
            description={
              NOTIFICATIONS_AVAILABLE
                ? 'Fa suonare il telefono anche a schermo bloccato.'
                : 'Non disponibile in Expo Go: serve l’app installata. Il timer funziona lo stesso finché resta aperta.'
            }
            value={settings.timerNotification && NOTIFICATIONS_AVAILABLE}
            onChange={(timerNotification) => update({ timerNotification })}
            disabled={!NOTIFICATIONS_AVAILABLE}
          />
          <SwitchRow
            label="Suono"
            value={settings.timerSound}
            onChange={(timerSound) => update({ timerSound })}
            disabled={!settings.timerNotification || !NOTIFICATIONS_AVAILABLE}
          />
          <SwitchRow
            label="Vibrazione"
            description="Alla spunta di una serie e a fine recupero."
            value={settings.timerVibration}
            onChange={(timerVibration) => update({ timerVibration })}
          />
          <SwitchRow
            label="Tieni lo schermo acceso"
            description="Solo durante un allenamento."
            value={settings.keepAwake}
            onChange={(keepAwake) => update({ keepAwake })}
          />
          <SwitchRow
            label="Suggerisci la volta precedente"
            description="Precompila i campi con quanto hai fatto l’ultima volta."
            value={settings.prefillFromPrevious}
            onChange={(prefillFromPrevious) => update({ prefillFromPrevious })}
          />

          <View style={{ padding: theme.space.lg, gap: theme.space.sm }}>
            <Text variant="label" tone="dim">
              Come registri lo sforzo
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
              {EFFORT_SCALES.map((scale) => (
                <Chip
                  key={scale}
                  label={EFFORT_SCALE_LABELS[scale]}
                  compact
                  selected={settings.effortScale === scale}
                  onPress={() => update({ effortScale: scale })}
                />
              ))}
            </View>
          </View>
        </SettingsSection>

        <SettingsSection
          title="Bilanciere e dischi"
          description="Servono al calcolatore dischi durante l’allenamento.">
          <NavRow
            label="Peso del bilanciere"
            value={formatWeight(settings.barWeight, settings.unit)}
            onPress={() => router.push('/plates')}
          />
          <NavRow
            label="Dischi disponibili"
            value={`${settings.plateInventory.length} tagli`}
            onPress={() => router.push('/plates')}
          />
        </SettingsSection>

        <SettingsSection
          title="Dati"
          description="Non c’è nessun account: il backup è l’unico modo di conservarli o spostarli.">
          <NavRow
            label="Esporta backup"
            description="Un file JSON con tutto: schede, storico, record, misure."
            icon="tray-arrow-up"
            onPress={onExport}
          />
          <NavRow
            label="Ripristina da backup"
            description="Sostituisce i dati attuali."
            icon="tray-arrow-down"
            onPress={onImport}
          />
          <NavRow label="Cancella tutti i dati" icon="delete-outline" destructive onPress={onReset} />
        </SettingsSection>

        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text variant="caption" tone="faint">
            OpenFit {Constants.expoConfig?.version ?? ''}
          </Text>
          <Text variant="caption" tone="faint">
            I tuoi dati restano su questo telefono.
          </Text>
        </View>
      </ScreenScroll>

      <Sheet visible={identityOpen} onClose={() => setIdentityOpen(false)} title="Nome" scrollable={false}>
        <TextField
          label="Come ti chiami"
          value={name}
          onChangeText={setName}
          placeholder="Il tuo nome"
          autoFocus
        />
        <Button
          title="Salva"
          fullWidth
          onPress={() => {
            update({ userName: name.trim() || null });
            setIdentityOpen(false);
          }}
        />
      </Sheet>

      <Sheet visible={restOpen} onClose={() => setRestOpen(false)} title="Recupero predefinito" scrollable={false}>
        <Text variant="caption" tone="dim">
          Vale per gli esercizi che non hanno un recupero proprio.
        </Text>
        <NumberStepper value={rest} onChange={setRest} step={15} min={0} max={600} suffix="s" />
        <Button
          title="Salva"
          fullWidth
          onPress={() => {
            update({ defaultRestSeconds: rest ?? 90 });
            setRestOpen(false);
          }}
        />
      </Sheet>

      <Sheet visible={goalOpen} onClose={() => setGoalOpen(false)} title="Obiettivo settimanale" scrollable={false}>
        <NumberStepper value={goal} onChange={setGoal} step={1} min={1} max={14} suffix="allenamenti" />
        <Button
          title="Salva"
          fullWidth
          onPress={() => {
            update({ weeklySessionGoal: goal ?? 4 });
            setGoalOpen(false);
          }}
        />
      </Sheet>

      <Sheet visible={busy} onClose={() => setBusy(false)} title="Un attimo…" scrollable={false}>
        <Text variant="caption" tone="dim">
          Sto lavorando sul file.
        </Text>
      </Sheet>
    </Screen>
  );
}
