const ngtools = require('@ngtools/webpack');
const webpackMerge = require('webpack-merge');
const commonPartial = require('./webpack/webpack.common');
const clientPartial = require('./webpack/webpack.client');
const serverPartial = require('./webpack/webpack.server');

const serverConfig = webpackMerge({}, commonPartial, serverPartial);

const clientConfig = webpackMerge({}, commonPartial, clientPartial);

module.exports = [clientConfig, serverConfig];
