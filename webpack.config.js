const ngtools = require('@ngtools/webpack');
const webpackMerge = require('webpack-merge');

const commonConfig = {
  devtool: 'source-map',
	resolve: {
    extensions: ['.ts', '.js']
  },
	output: {
		path: 'dist'
	},
	module: {
		rules: [
			{
        test: /\.ts$/,
        loader: '@ngtools/webpack',
      }
		]
  }
};

const serverConfig = webpackMerge({}, commonConfig, {
  entry: './src/main.server.ts',
  output: {
    filename: 'server.js'
  },
  target: 'node',
  plugins: [
    new ngtools.AotPlugin({
      tsConfigPath: './src/tsconfig.server.json'
    })
  ]
});

const clientConfig = webpackMerge({}, commonConfig, {
  entry:  './src/main.browser.ts',
  output: {
    filename: 'client.js'
  },
  target: 'web',
  plugins: [
    new ngtools.AotPlugin({
      tsConfigPath: './src/tsconfig.browser.json'
    })
  ]
});

module.exports = [serverConfig];
