/// /////////////////////////////////////////////////////////////
// For authoring Nightwatch tests, see
// https://nightwatchjs.org/guide
//
// For more information on working with page objects see:
//   https://nightwatchjs.org/guide/working-with-page-objects/
/// /////////////////////////////////////////////////////////////

module.exports = {
  beforeEach: (browser) => browser.init(),

  'e2e tests using page objects': (browser) => {
    const homepage = browser.page.homepage()
    homepage.waitForElementVisible('@appContainer')

    const app = homepage.section.app
    app.assert.elementCount('@navLinks', 2)
    app.expect.section('@header').to.be.visible
    app.expect.section('@body').to.be.visible
    app.expect.section('@footer').to.be.visible
    app.expect.section('@header').text.to.match(/^Home$/)
    app.expect.section('@body').text.to.match(/Home page/)
    app.expect.section('@footer').text.to.match(/^Footer$/)

    browser.end()
  }
}
