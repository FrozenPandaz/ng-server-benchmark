const ngtools = require('@ngtools/webpack');
const webpackMerge = require('webpack-merge');
const commonPartial = require('./webpack/webpack.common');
const clientPartial = require('./webpack/webpack.client');
const serverPartial = require('./webpack/webpack.server');
const { getAotPlugin } = require('./webpack/webpack.aot');

module.exports = function (options) {
  options = options || {};
  console.log(options);

  const serverConfig = webpackMerge({}, commonPartial, serverPartial, {
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
    configs = [clientConfig, serverConfig];

  } else if (options.client) {
    configs.push(clientConfig);

  } else if (options.server) {
    configs.push(serverConfig);
  }

  return configs;
}
