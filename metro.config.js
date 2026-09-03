const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Drizzle genera le migrazioni come file .sql e `drizzle/migrations.js` le
// importa. Senza questa riga Metro non sa risolverle e l'app crasha al boot.
config.resolver.sourceExts.push('sql');

module.exports = config;
