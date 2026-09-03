# OpenFit

Diario di allenamento per la sala pesi. App Android nativa: si registra ogni
serie mentre la si fa, il recupero è cronometrato e i carichi della volta
precedente sono sempre sotto gli occhi.

I dati restano **sul telefono**. Nessun account, nessun server, nessuna
sincronizzazione: il backup si fa esportando un file JSON.

> **Stato:** in sviluppo. Vedi *Cosa c'è adesso* più sotto per quello che
> funziona davvero, senza promesse.

## Cosa fa

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

## Dati e privacy

Profilo, schede, storico e misurazioni vivono in un database SQLite nella
sandbox dell'app. Non escono dal telefono. Disinstallare l'app cancella tutto:
l'export JSON dal Profilo è l'unico modo per conservarli o spostarli.
