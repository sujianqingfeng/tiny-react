// eslint-disable-next-line @typescript-eslint/no-var-requires
const { defaults } = require('jest-config')

module.exports = {
  ...defaults,
  rootDir: process.cwd(),
  moduleDirectories: [
    'dist/node_modules',
    ...defaults.moduleDirectories
  ],
  testEnvironment: 'jsdom',
}