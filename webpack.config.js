const ngtools = require('@ngtools/webpack');
const webpackMerge = require('webpack-merge');
const commonPartial = require('./webpack/webpack.common');
const clientPartial = require('./webpack/webpack.client');
const serverPartial = require('./webpack/webpack.server');
const { getAotPlugin } = require('./webpack/webpack.aot');

module.exports = function (options) {
  options = options || {};

  if (options.aot) {
    console.log(`Running build for ${options.client ? 'client' : 'server'} with AoT Compilation`)
  }

  const serverConfig = webpackMerge({}, commonPartial, serverPartial, {
    entry: options.aot ? './src/main.server.aot.ts' : serverPartial.entry, // Temporary
    plugins: [
      getAotPlugin('server', !!options.aot)
    ]
  });

  const clientConfig = webpackMerge({}, commonPartial, clientPartial, {
    plugins: [
      getAotPlugin('client', !!options.aot)
    ]
  });

  const configs = [];
  if (!options.aot) {
    configs.push(clientConfig, serverConfig);

  } else if (options.client) {
    configs.push(clientConfig);

  } else if (options.server) {
    configs.push(serverConfig);
  }

  return configs;
}
