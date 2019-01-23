import webpack from "webpack";
const { resolve } = require('path');

const config: webpack.Configuration = {
	mode: 'production',
	devtool: "source-map",
	entry: './app/app.ts',
	output: {
		path: resolve(__dirname, 'out'),
		filename: 'app.js'
	},
	resolve: {
		extensions: ['.ts', '.js', '.less', '.css']
	},
	module: {
		rules: [
			{ test: /\.ts$/, loader: 'awesome-typescript-loader' },
			{
				test: /\.css$/,
				use: [{
					loader: 'style-loader' 
				}, {
					loader: 'css-loader?-url'
				}]
			},
			{
				test: /\.less$/,
				use: [{
					loader: 'style-loader'
				}, {
					loader: 'css-loader?-url'
				}, {
					loader: 'less-loader'
				}]
			},
		]
	},
}

module.exports = config;