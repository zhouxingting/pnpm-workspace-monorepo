const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  // 输入
  entry: "./src/index.js",
  mode: "development",
  resolve: {
    extensions: [".js", ".ts"],
  },
  devServer: {
    port: 7080,
    // 自动打开浏览器
    open: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|mjs|ts)$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      // 注意路径
      template: path.join(__dirname, "./public/index.html"),
    }),
  ],
};
