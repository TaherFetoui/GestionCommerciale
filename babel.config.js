module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@components': './components',
            '@screens': './screens',
            '@navigation': './navigation',
            '@services': './services',
            '@constants': './constants',
            '@context': './context',
            '@hooks': './hooks',
            '@styles': './styles',
            '@lib': './lib',
            '@assets': './assets',
          },
        },
      ],
    ],
  };
};