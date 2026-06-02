module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // El plugin de reanimated debe ir SIEMPRE el último.
    plugins: ['react-native-reanimated/plugin'],
  };
};
