const webpack = require('webpack')
const path = require('path')
const HashPlugin = require('hash-webpack-plugin')
const baseDir = __dirname

const config = {
  devtool: 'cheap-module-source-map', // 'cheap-source-map',
  entry: {
    client: path.resolve(baseDir, 'lib', 'client', 'client.jsx')
  },
  output: {
    path: path.resolve(baseDir, 'dist'),
    filename: '[name].[hash].js'
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {}
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        include: [
          path.resolve(baseDir, 'lib'),
          path.resolve(baseDir, 'lib', 'client'),
          path.resolve(baseDir, 'lib', 'client', 'Components')
        ],
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.less$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          { loader: 'less-loader' }
        ]
      }
    ]
  },
  plugins: [
    // new webpack.ProvidePlugin({
    //   // $: 'jquery' // ,
    //   // jQuery: 'jquery',
    //   // jsonview: 'jsonview',
    //   // bootstrap: 'bootstrap'
    // }),
    // react needs to be built with NODE_ENV = 'production'
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
      // 'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new HashPlugin({ path: './dist', fileName: 'hash.txt' }),
    // new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin() // ,
    // new webpack.optimize.UglifyJsPlugin({
    //   compress: { warnings: false },
    //   output: { comments: false },
    //   sourceMap: true
    // })
  ]
}

module.exports = config
