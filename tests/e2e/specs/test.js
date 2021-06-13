// For authoring Nightwatch tests, see
// https://nightwatchjs.org/guide

module.exports = {
  'default e2e tests': browser => {
    browser
      .init()
      .waitForElementVisible('#app')
      .assert.elementPresent('.page .header')
      .assert.containsText('h1', 'Home')
      .assert.elementCount('#app #nav a', 2)
      .end()
  },

  'example e2e test using a custom command': browser => {
    browser
      .openHomepage()
      .assert.elementPresent('.page .body')
      .end()
  }
}
