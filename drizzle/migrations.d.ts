/**
 * Tipi per `drizzle/migrations.js`, che è generato da drizzle-kit e importa
 * i file .sql (risolti da Metro grazie a `sourceExts` + babel inline-import).
 */
declare const migrations: {
  journal: {
    entries: { idx: number; when: number; tag: string; breakpoints: boolean }[];
  };
  migrations: Record<string, string>;
};

export default migrations;
