var webpack = require('webpack');
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');

var config = {
  entry: {
    app: './src/js/index.js',
  },
  output: {
    path: path.join(__dirname, 'public'),
    filename: 'bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loaders: ['babel?presets[]=react,presets[]=es2015'],
      },
      {
        test: /\.s(a|c)ss$/,
        loader: 'style!css!sass'
      },
      {
        test: /\.(png|gif|jpg)$/i,
        loader: 'url-loader',
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ]
}

if (process.env.NODE_ENV === 'production') {
  config.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      compress: {
        warnings: false
      },
      exclude: [/\.min\.js$/gi],
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.tmpl',
      inlineSource: '.js$',
    }),
    new HtmlWebpackInlineSourcePlugin()
  )
} else {
  config.plugins.push(
    new HtmlWebpackPlugin({
      template: 'src/index.tmpl',
    })
  )
}

module.exports = config
