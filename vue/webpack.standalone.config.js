/**
 * Standalone webpack config for testing the hypervideo player without Moodle.
 *
 * Usage:
 *   cd vue
 *   npm run dev:standalone
 *
 * Then open dev/index.html in your browser.
 */

const path = require("path");
const { VueLoaderPlugin } = require("vue-loader");
const webpack = require("webpack");

module.exports = {
  mode: "development",
  entry: "./src/main.js",
  output: {
    path: path.resolve(__dirname, "dev/dist"),
    publicPath: "",
    filename: "hypervideo-standalone.js",
    library: {
      type: "umd",
      name: "Hypervideo",
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
      "vue$": "vue/dist/vue.esm-bundler.js",
      // Redirect Moodle AMD imports to local mocks.
      "core/ajax": path.resolve(__dirname, "dev/mocks/core-ajax.js"),
      "core/str": path.resolve(__dirname, "dev/mocks/core-ajax.js"),
      "core/localstorage": path.resolve(__dirname, "dev/mocks/core-localstorage.js"),
      "core/notification": path.resolve(__dirname, "dev/mocks/core-ajax.js"),
      "core/modal_factory": path.resolve(__dirname, "dev/mocks/core-ajax.js"),
      "core/modal_events": path.resolve(__dirname, "dev/mocks/core-ajax.js"),
      "core/fragment": path.resolve(__dirname, "dev/mocks/core-ajax.js"),
      "core/pubsub": path.resolve(__dirname, "dev/mocks/core-ajax.js"),
      "jquery": path.resolve(__dirname, "dev/mocks/core-ajax.js"),
    },
    extensions: ["*", ".js", ".vue", ".json"],
    fallback: {
      path: false,
      fs: false,
    },
  },
  performance: { hints: false },
  devtool: "eval-source-map",
  plugins: [
    new VueLoaderPlugin(),
    new webpack.DefinePlugin({
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    }),
  ],
};
