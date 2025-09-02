const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Activer la division du code pour de meilleures performances
  config.optimization.splitChunks = {
    chunks: 'all',
  };

  return config;
};