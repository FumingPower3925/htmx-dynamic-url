module.exports = function(config) {
  const htmxVersion = process.env.HTMX_VERSION || 'v1';
  const htmxPath = `node_modules/htmx-${htmxVersion}/dist/htmx.js`;

  console.log(`[Karma Config] Loading HTMX version '${htmxVersion}' from: ${htmxPath}`);

  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai'],
    files: [
      htmxPath,
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