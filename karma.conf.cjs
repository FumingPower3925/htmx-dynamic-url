module.exports = function(config) {
  const htmxVersion = process.env.HTMX_VERSION || 'v1';
  const htmxPath = `node_modules/htmx-${htmxVersion}/dist/htmx.js`;

  const extFileType = process.env.EXT_FILE || 'src';
  const extPath = extFileType === 'min'
                  ? 'dist/dynamic-url.min.js'
                  : 'src/dynamic-url.js';

  const browser = process.env.KARMA_BROWSER || 'ChromeHeadless';

  console.log(`[Karma Config] Loading HTMX version '${htmxVersion}' from: ${htmxPath}`);
  console.log(`[Karma Config] Loading Extension from: ${extPath}`);
  console.log(`[Karma Config] Browser: ${browser}`);

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
    browsers: [browser],
    // Chrome-for-Testing builds (what setup-chrome installs in CI) ship without the
    // SUID sandbox helper, and Ubuntu 23.10+ blocks the unprivileged-userns fallback
    // via AppArmor, so plain ChromeHeadless cannot start there. Only CI opts into
    // this launcher; local runs use the sandboxed default.
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu']
      }
    },
    singleRun: true,
    concurrency: Infinity,
    client: {
       mocha: {
         ui: 'bdd',
       }
    }
  })
}