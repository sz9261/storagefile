var libConfig = {
    entry: {
      library: './lib/all.ts'
	  },
    target: 'node',
    mode: 'development',
    output: {
        library: 'storagefile',
        libraryTarget: 'umd',
        path: __dirname + '/dist',
        filename: 'storagefile.js'
    },

    // Enable source maps
    devtool: "source-map",

	externals: {
    "@terrencecrowley/context": "commonjs @terrencecrowley/context",
    "@terrencecrowley/log": "commonjs @terrencecrowley/log",
    "@terrencecrowley/storage": "commonjs @terrencecrowley/storage"
	},
		

    module: {
		rules: [
			{ test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
			{ test: /\.json$/, loader: 'json-loader' },
			{ test: /\.js$/, enforce: "pre", loader: "source-map-loader" }
		]
    },

    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    }

};

module.exports = [ libConfig ];
