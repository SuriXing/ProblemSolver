const { defineConfig } = require('cypress');

module.exports = defineConfig({
  projectId: 'worry-solver',
  viewportWidth: 1280,
  viewportHeight: 720,
  defaultCommandTimeout: 10000,
  video: true,
  screenshotOnRunFailure: true,

  e2e: {
    baseUrl: 'http://127.0.0.1:3000',
    setupNodeEvents(on) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome' && browser.isHeadless) {
          launchOptions.args.push('--disable-gpu');
          return launchOptions;
        }

        if (browser.name === 'firefox' && browser.isHeadless) {
          launchOptions.args.push('-width=1280');
          launchOptions.args.push('-height=720');
          return launchOptions;
        }

        return launchOptions;
      });
    }
  },

  env: {
    viewports: {
      'desktop-large': {
        width: 1920,
        height: 1080
      },
      'desktop-standard': {
        width: 1366,
        height: 768
      },
      tablet: {
        width: 768,
        height: 1024
      },
      'mobile-large': {
        width: 428,
        height: 926
      },
      'mobile-medium': {
        width: 390,
        height: 844
      },
      'mobile-small': {
        width: 375,
        height: 667
      }
    }
  }
});
