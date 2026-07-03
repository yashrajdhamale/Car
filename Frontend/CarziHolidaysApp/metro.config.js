const { getDefaultConfig } = require('@react-native/metro-config');

const config = {};

module.exports = (() => {
  return {
    ...getDefaultConfig(__dirname),
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
  };
})();