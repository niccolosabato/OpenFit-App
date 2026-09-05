# OpenFit

Diario di allenamento per la sala pesi. App Android nativa: si registra ogni
serie mentre la si fa, il recupero è cronometrato e i carichi della volta
precedente sono sempre sotto gli occhi.

L'interfaccia è scura, con le azioni ancorate in fondo allo schermo: durante
una seduta il telefono si tiene con una mano sola, e ciò che si tocca fra una
serie e l'altra non deve essere inseguito scorrendo.

I dati restano **sul telefono**. Nessun account, nessun server, nessuna
sincronizzazione: il backup si fa esportando un file JSON.

> **Stato:** funzionalmente completa e usabile in palestra, non ancora provata
> su un ciclo di allenamento lungo. Sotto c'è anche cosa *non* fa.

## Cosa fa

- **Primo avvio guidato** — nome, unità di misura e colore in pochi passi,
  tutti saltabili
- **Libreria esercizi** — ~140 esercizi precaricati con muscolo, attrezzo e
  modo di misurazione (carico × ripetizioni, corpo libero, zavorrato,
  assistito, a tempo, distanza), più esercizi personalizzati
- **Schede** — giorni, esercizi, serie pianificate con rep range, RPE/RIR e
  recuperi; superset
- **Sessione live** — si spunta serie per serie, con il carico della volta
  scorsa già in colonna e il timer di recupero che parte da solo
- **Tutti i tipi di serie** — riscaldamento, allenante, top set, back-off,
  AMRAP, a cedimento, parziali, isometria, e le serie estese (drop set,
  rest-pause, myo-reps, cluster)
- **Record e progressione** — massimale stimato, record per ripetizione,
  badge quando si batte un record
- **Statistiche** — serie settimanali per gruppo muscolare, volume, frequenza,
  peso corporeo

- **Backup** — export e import di un file JSON con tutto dentro
- **Calcolatore dischi** — quali dischi per lato, con la dotazione della *tua*
  palestra e il tuo bilanciere

## Cosa non fa

- Nessuna sincronizzazione fra dispositivi e nessun account: si passa dal file
  di backup.
- Nessun conteggio calorie, nessun piano alimentare.
- Niente iOS al momento: il progetto è cross-platform ma è provato solo su
  Android.
- Il volume conta il **carico esterno**: un esercizio a corpo libero senza
  zavorra registra le ripetizioni ma non fa tonnellaggio.

## Stack

Expo SDK 57 (React Native 0.86) + TypeScript, expo-router, SQLite locale con
Drizzle ORM. Nessun backend.

## Sviluppo

```bash
npm install
npm start          # QR code → Expo Go sul telefono
```

Se il telefono non è sulla stessa rete: `npm start -- --tunnel`.

Dopo aver modificato `src/db/schema.ts`:

```bash
npm run db:generate
```

Verifiche:

```bash
npm test           # logica pura: e1RM, dischi, unità, aggregazioni
npm run typecheck
npx expo export -p android
```

Per un APK installabile senza Expo Go (serve un account Expo gratuito):

```bash
npx eas build -p android --profile preview
```

## Dati e privacy

Profilo, schede, storico e misurazioni vivono in un database SQLite nella
sandbox dell'app. Non escono dal telefono. Disinstallare l'app cancella tutto:
l'export JSON dal Profilo è l'unico modo per conservarli o spostarli.
