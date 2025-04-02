module.exports = function(config) {
  const htmxVersion = process.env.HTMX_VERSION || 'v1';
  const htmxPath = `node_modules/htmx-${htmxVersion}/dist/htmx.js`;

  const extFileType = process.env.EXT_FILE || 'src';
  const extPath = extFileType === 'min'
                  ? 'dist/dynamic-url.min.js'
                  : 'src/dynamic-url.js';

  console.log(`[Karma Config] Loading HTMX version '${htmxVersion}' from: ${htmxPath}`);
  console.log(`[Karma Config] Loading Extension from: ${extPath}`);

  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai'],
    files: [
      htmxPath,
      extPath,
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