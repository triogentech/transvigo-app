module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]], // web: zustand's ESM build uses import.meta
    // Reanimated 4 moved its worklets transform into react-native-worklets.
    // This plugin MUST be listed last.
    plugins: ['react-native-worklets/plugin'],
  };
};
