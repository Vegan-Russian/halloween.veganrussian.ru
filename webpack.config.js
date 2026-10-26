const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const imageminMozjpeg = require("imagemin-mozjpeg");
const ImageminPlugin = require("imagemin-webpack-plugin").default;
const fs = require("fs");
const path = require("path");
const ImageminWebpWebpackPlugin = require("imagemin-webp-webpack-plugin");
const globImporter = require("node-sass-glob-importer");
const baseURL = process.env.BASE_URL || '';



let targetBrowser = "web";
let pluginImgMinify = () => {};
function resolveSrc(_path) {
  return path.join(__dirname, _path);
}

module.exports = function (_, argv) {
  if (argv.mode === "production") {
    targetBrowser = "browserslist";
    pluginImgMinify = new ImageminPlugin({
      test: /\.(jpe?g|png|gif|svg)$/i,
      pngquant: {
        quality: "100",
      },
      gifsicle: {
        optimizationLevel: 1,
      },
      svgo: null,
      plugins: [
        imageminMozjpeg({
          quality: 100,
          progressive: true,
        }),
      ],
    });
  }
  let templates = [];
  let arrTemplates = fs.readdirSync("src/pug");
  arrTemplates.forEach((file) => {
    if (file.match(/\.pug$/)) {
      let filename = file.substring(0, file.length - 4);
      templates.push(
        new HtmlWebpackPlugin({
          template: "src/pug/" + filename + ".pug",
          filename: filename + ".html",
        })
      );
    }
  });

  return {
    target: targetBrowser,
    devtool: "source-map",

    entry: ["./src/js/app.js"],
    output: {
      filename: "[name].[contenthash].js",
      path: path.resolve(__dirname, "dist"),
      publicPath: "./",
    },
    module: {
      rules: [
        {
          test: /\.pug$/,
          use: [
            'raw-loader',
            {
            loader: 'pug-html-loader',
            options: {
                data: { baseURL }  // передаем baseURL в шаблоны pug
            }
            }],
        },
        {
          type: "javascript/auto",
          test: /\.(jpe?g|png|gif|svg)$/i,
          loader: "file-loader",
          options: {
            name: "../images/" + "[name].[ext]",
          },
        },
        {
          type: "javascript/auto",
          test: /\.(woff|ttf|otf|woff2|eot)$/i,
          loader: "file-loader",
          options: {
            name: "../fonts/" + "[name].[ext]",
          },
        },

        {
          type: "javascript/auto",
          test: /\.(webmanifest|ico)$/i,
          loader: "file-loader",
        },

        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
        },
        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
            },
            {
              loader: "css-loader",
              options: {
                sourceMap: false,
                url: false,
              },
            },
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  sourceMap: false,
                  ident: "postcss",
                  plugins: [require("autoprefixer")],
                },
              },
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: false,
                webpackImporter: false,
                sassOptions: {
                  includePaths: [resolveSrc("node_modules")],
                  importer: globImporter(),
                },
              },
            },
            {
              loader: "import-glob",
            },
          ],
        },
      ],
    },
    devServer: {
      contentBase: resolveSrc("./dist/"),
      watchContentBase: true,
      port: 3010,

      watchOptions: {
        poll: true,
        ignored: /node_modules/,
      },
      hot: true,
      writeToDisk: true,
    },
    plugins: [
      ...templates,
      new CleanWebpackPlugin({ dry: false, cleanStaleWebpackAssets: false }),
      new MiniCssExtractPlugin({
        filename: "./css/style.[contenthash].css",
      }),
      new ImageminWebpWebpackPlugin({
        config: [
          {
            test: /\.(jpe?g|png)/,
            options: {
              quality: 100,
            },
          },
        ],
      }),
      new CopyPlugin({
        patterns: [
          { from: "src/images", to: "./images", noErrorOnMissing: true },
          { from: "src/fonts", to: "./fonts", noErrorOnMissing: true },
          { from: "src/data", to: "./data", noErrorOnMissing: true },
        ],
      }),
      pluginImgMinify,
    ],
  };
};
