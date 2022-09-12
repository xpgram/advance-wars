const CopyWebpackPlugin = require('copy-webpack-plugin')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')

module.exports = {
    entry: ['regenerator-runtime/runtime.js', './src/index.ts'],
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.(glsl|vs|fs)$/,
                use: 'ts-shader-loader',
            },
            {
                test: /\.(ts|js)x?$/,
                use: 'babel-loader',
                exclude: /node_modules/,
            },
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json'],
    },
    devServer: {
        static: {
            directory: 'dist',
        },
        port: 3000,
        proxy: {
            '/': {
                target: 'http://localhost:3001',
                // ws: true,
                    // TODO Enable? Don't I want websocket=true?
                secure: false,
                changeOrigin: true,
                logLevel: 'debug',
            },
            '/api': {
                target: 'http://localhost:3002',
                secure: false,
                changeOrigin: true,
                logLevel: 'debug',
            },
        }
    },
    devtool: 'inline-source-map',
    plugins: [
        new CopyWebpackPlugin({
            patterns: [{
                from: "build/assets",
                to: "assets"
            }],
        }),
        new HTMLWebpackPlugin({
            template: 'build/index.html',
            filename: 'index.html'
        }),
        new webpack.ProvidePlugin({
            PIXI: 'pixi.js'
        })
    ]
}