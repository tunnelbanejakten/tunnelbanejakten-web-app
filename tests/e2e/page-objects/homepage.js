/**
 * A Nightwatch page object. The page object name is the filename.
 *
 * Example usage:
 *   browser.page.homepage.navigate()
 *
 * For more information on working with page objects see:
 *   https://nightwatchjs.org/guide/working-with-page-objects/
 *
 */

module.exports = {
  url: '/',
  commands: [],

  // A page object can have elements
  elements: {
    appContainer: '#app'
  },

  // Or a page objects can also have sections
  sections: {
    app: {
      selector: '#app',

      elements: {
        navLinks: '#nav a'
      },

      // - a page object section can also have sub-sections
      // - elements or sub-sections located here are retrieved using the "app" section as the base
      sections: {
        header: {
          selector: 'div.header',

          elements: {
            title: 'h1'
          }
        },

        body: {
          // the equivalent css selector for the "welcome" sub-section would be:
          //  '#app div.hello'
          selector: 'div.body'
        },

        footer: {
          // the equivalent css selector for the "welcome" sub-section would be:
          //  '#app div.hello'
          selector: 'div.footer'
        }
      }
    }
  }
}
