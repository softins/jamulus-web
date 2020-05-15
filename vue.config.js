module.exports = {
  devServer: {
    port: 8080,
    host: '0.0.0.0',
    disableHostCheck: true,
    "public": "jamulus.softins.co.uk:8080"
  },
  pages: {
    app: {
      filename: 'index.html',
      entry: 'src/main.js',
      title: 'Jamulus Explorer'
    }
  }
}
