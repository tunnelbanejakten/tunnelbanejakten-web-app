process.env.VUE_APP_VERSION = require('./package.json').version

module.exports = {
  lintOnSave: false,
  pwa: {
    name: 'Lagportal för Tunnelbanejakten',
    themeColor: '#fdc648',
    msTileColor: '#fdc648',
    iconPaths: {
      favicon32: 'manifest/favicon-32x32.png',
      favicon16: 'manifest/favicon-16x16.png',
      appleTouchIcon: 'manifest/apple-touch-icon.png',
      maskIcon: 'manifest/safari-pinned-tab.svg',
      msTileImage: 'manifest/mstil-150x150.png'
    }    
  }
}
