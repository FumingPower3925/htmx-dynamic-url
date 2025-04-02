module.exports = function(config) {
    config.set({
      basePath: '',
      frameworks: ['mocha', 'chai'],
      files: [
        'node_modules/htmx.org/dist/htmx.js',
        'src/dynamic-url.js',
        'test/test.js'
      ],
      exclude: [],
      preprocessors: {},
      reporters: ['progress'],
      port: 9876,
      colors: true,
      logLevel: config.LOG_INFO,
      autoWatch: false,
      browsers: ['ChromeHeadless'],
      singleRun: true,
      concurrency: Infinity,
      client: {
         mocha: {
           ui: 'bdd',
         }
      }
    })
  }