import webpack from 'webpack';
import { merge } from 'webpack-merge';
import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ZipWebpackPlugin from 'zip-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import { getCommonConfig } from '../webpack.common';
import { updateManifest } from '../helpers';
import { firefoxManifestDiff } from './manifest.firefox';
import {
    STAGE_ENV,
    IS_DEV,
    StageEnv,
    Browser,
    SRC_PATH,
} from '../consts';

const FIREFOX_PATH = 'firefox';

let zipFilename = 'firefox.zip';

const BACKGROUND_PATH = path.resolve(__dirname, '..', SRC_PATH, 'background');

const CUSTOM_PROTOCOL_HANDLER_PATH = path.resolve(__dirname, '..', SRC_PATH, 'custom-protocol-handler');

if (IS_DEV && STAGE_ENV === StageEnv.Prod) {
    zipFilename = 'firefox-prod.zip';
}

const commonConfig = getCommonConfig(Browser.Firefox);

if (commonConfig.resolve) {
    commonConfig.resolve.fallback = {
        buffer: require.resolve('buffer'),
    };
}

const plugins: webpack.WebpackPluginInstance[] = [
    new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.NormalModuleReplacementPlugin(/\.\/init\/initAbstract/, ((resource: any) => {
        // eslint-disable-next-line no-param-reassign
        resource.request = resource.request
            .replace(/\.\/init\/initAbstract/, './init/initMV3');
    })),
    new webpack.NormalModuleReplacementPlugin(/\.\/AbstractTimers/, ((resource: any) => {
        // eslint-disable-next-line no-param-reassign
        resource.request = resource.request.replace(/\.\/AbstractTimers/, './Mv3Timers');
    })),
    new webpack.NormalModuleReplacementPlugin(/\.\/networkConnectionObserverAbstract/, ((resource: any) => {
        // eslint-disable-next-line no-param-reassign
        resource.request = resource.request.replace(/\.\/networkConnectionObserverAbstract/, './networkConnectionObserverMv3');
    })),
    new CopyWebpackPlugin({
        patterns: [
            {
                from: path.resolve(__dirname, '../manifest.common.json'),
                to: 'manifest.json',
                transform: (content: Buffer) => updateManifest(content, firefoxManifestDiff),
            },
        ],
    }),
    new HtmlWebpackPlugin({
        template: path.join(BACKGROUND_PATH, 'index.html'),
        filename: 'background.html',
        chunks: ['background'],
        cache: false,
    }),
    new HtmlWebpackPlugin({
        template: path.join(CUSTOM_PROTOCOL_HANDLER_PATH, 'index.html'),
        filename: 'custom-protocol-handler.html',
        chunks: ['custom-protocol-handler'],
        cache: false,
    }),
    new ZipWebpackPlugin({
        path: '../',
        filename: zipFilename,
    }) as unknown as webpack.WebpackPluginInstance,
];

const outputPath = commonConfig.output?.path;

if (!outputPath) {
    throw new Error('Cannot get output path');
}

const firefoxDiffConfig = {
    output: {
        path: path.join(outputPath, FIREFOX_PATH),
    },
    plugins,
};

export const firefoxConfig = merge(commonConfig, firefoxDiffConfig);
