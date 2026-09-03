module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Incorpora il contenuto dei .sql delle migrazioni nel bundle come
    // stringhe. Va di pari passo con `sourceExts` in metro.config.js.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
