const path = require('path');
const Dotenv = require('dotenv-webpack');
const WebpackShellPluginNext = require('webpack-shell-plugin-next');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: {
        server: './src/index.ts',
    },
    target: 'node',
    mode: 'development',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(png|jpg|gif|jpeg|webp|svg|woff|woff2|eot|ttf|otf)$/,
                use: ['file-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new Dotenv({
            path: './config/.env.ini',
            safe: true,
            allowEmptyValues: true,
            systemvars: true,
            silent: true,
            defaults: false
        }),
        new WebpackShellPluginNext({
            onBuildStart: {
                scripts: ['echo "===> Starting packing with WEBPACK 5"'],
                blocking: true,
                parallel: false
            },
            onBuildEnd: {
                // After webpack finishes bundling, copy the file using shelljs
                scripts: ['clear && npm run start'],
                blocking: false,
                parallel: true
            }
        })
    ],
    externals: [nodeExternals()],
    watch: true,
};
