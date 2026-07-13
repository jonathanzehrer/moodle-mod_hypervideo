// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * @package    mod_hypervideo
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const CompressionPlugin = require("compression-webpack-plugin");
const fs = require("fs");
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");
const webpack = require("webpack");

module.exports = (env, options) => {
  const exports = {
    entry: "./src/main.js",
    output: {
      path: path.resolve(__dirname, "../amd/build"),
      publicPath: "",
      filename: "app-lazy.min.js",
      chunkFilename: "[id].app-lazy.js?v=[hash]",
      library: {
        type: "amd",
        export: "default",
      },
    },
    target: "web",
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: "babel-loader",
          exclude: /node_modules/,
          options: {
            babelrc: false,
            presets: [["@babel/preset-env", { forceAllTransforms: true }]],
            plugins: [
              "@babel/plugin-syntax-dynamic-import",
              "@babel/plugin-transform-modules-amd",
            ],
          },
        },
        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            "vue-style-loader",
            "css-loader",
            {
              loader: "sass-loader",
              options: {
                api: "modern",
                sassOptions: {
                  silenceDeprecations: ["legacy-js-api", "import"],
                },
              },
            },
          ],
        },
        {
          test: /\.vue$/,
          loader: "vue-loader",
        },
      ],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        vue$: "vue/dist/vue.esm-bundler.js",
      },
      extensions: ["*", ".js", ".vue", ".json"],
    },
    performance: {
      hints: false,
    },
    devtool: false,
    plugins: [
      new VueLoaderPlugin(),
      // Clean old files before build and copy to amd/src after build.
      {
        apply: (compiler) => {
          compiler.hooks.beforeRun.tap("CleanBeforeBuild", () => {
            const buildDir = path.resolve(__dirname, "../amd/build");
            const srcDir = path.resolve(__dirname, "../amd/src");

            const mainBuildFile = path.join(buildDir, "app-lazy.min.js");
            if (fs.existsSync(mainBuildFile)) {
              fs.unlinkSync(mainBuildFile);
            }

            if (fs.existsSync(buildDir)) {
              fs.readdirSync(buildDir)
                .filter((file) => file.endsWith(".app-lazy.js"))
                .forEach((file) => fs.unlinkSync(path.join(buildDir, file)));
            }

            const srcFile = path.join(srcDir, "app-lazy.js");
            if (fs.existsSync(srcFile)) {
              fs.unlinkSync(srcFile);
            }
          });

          compiler.hooks.afterEmit.tap("CopyToSrc", () => {
            const srcPath = path.resolve(
              __dirname,
              "../amd/build/app-lazy.min.js",
            );
            const destPath = path.resolve(__dirname, "../amd/src/app-lazy.js");
            if (fs.existsSync(srcPath)) {
              // Create directory if it doesn't exist
              const destDir = path.dirname(destPath);
              if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
              }
              fs.copyFileSync(srcPath, destPath);
            }
          });
        },
      },
    ],
    watchOptions: {
      ignored: /node_modules/,
    },
    externals: {
      "core/ajax": { amd: "core/ajax" },
      "core/str": { amd: "core/str" },
      "core/localstorage": { amd: "core/localstorage" },
      "core/notification": { amd: "core/notification" },
      "core/modal_factory": { amd: "core/modal_factory" },
      "core/modal_events": { amd: "core/modal_events" },
      "core/fragment": { amd: "core/fragment" },
      "core/pubsub": { amd: "core/pubsub" },
      jquery: { amd: "jquery" },
    },
  };

  if (options.mode === "production") {
    exports.devtool = false;
    exports.plugins = (exports.plugins || []).concat([
      new webpack.DefinePlugin({
        "process.env": { NODE_ENV: '"production"' },
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false,
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
      }),
      new webpack.LoaderOptionsPlugin({ minimize: true }),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new CompressionPlugin({
        filename: "[path][base].br",
        algorithm: "brotliCompress",
        test: /\.(js|css|html|svg)$/,
        compressionOptions: { level: 11 },
        threshold: 10240,
        minRatio: 0.8,
        deleteOriginalAssets: false,
      }),
      new CompressionPlugin({
        filename: "[path][base].gz",
        algorithm: "gzip",
        test: /\.(js|css|html|svg)$/,
        compressionOptions: { level: 9 },
        threshold: 10240,
        minRatio: 0.8,
        deleteOriginalAssets: false,
      }),
    ]);
    exports.optimization = {
      minimize: true,
      nodeEnv: "production",
      usedExports: true,
      sideEffects: false,
      minimizer: [
        new TerserPlugin({
          parallel: true,
          extractComments: false,
          terserOptions: {
            compress: {
              drop_debugger: true,
              pure_funcs: ["console.log", "console.info", "console.debug"],
              passes: 2,
            },
            mangle: {
              safari10: true,
            },
            format: {
              comments: false,
              ascii_only: true,
            },
          },
        }),
      ],
    };
  } else {
    exports.devtool = "eval-source-map";
    exports.plugins = (exports.plugins || []).concat([
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false,
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
      }),
    ]);
    exports.optimization = {
      minimize: false,
      nodeEnv: "development",
      usedExports: true,
    };
  }

  return exports;
};
