const babel = require('@babel/core')
const fs = require('fs')
const path = require('path')
const assert = require('assert')

const fixturesDir = path.join(__dirname, 'fixtures')
const pluginPath = path.join(
  __dirname,
  '../../babel-plugin-add-react-displayname'
)

describe('add-react-displayname transform', () => {
  fs.readdirSync(fixturesDir).forEach(fixture => {
    const name = path.basename(fixture, path.extname(fixture))
    it('transforms ' + name, () => {
      const actual = transformFile(path.join(fixturesDir, fixture))
      expect(actual).toMatchSnapshot()
    })
  })
})

function readFile(filename) {
  let file = fs.readFileSync(filename, 'utf8').trim()
  file = file.replace(/\r\n/g, '\n')
  return file
}

function transformFile(filename) {
  return babel.transformFileSync(filename, {
    presets: ['@babel/react', '@babel/typescript'],
    plugins: [
      [
        pluginPath,
        { knownComponents: ['Component5a', 'Component5b', 'Component5c'] },
      ],
      ['@babel/proposal-decorators', { legacy: true }],
      // ['@babel/proposal-class-properties', { loose: true }],
      // '@babel/proposal-do-expressions',
      // '@babel/proposal-export-default-from',
      // '@babel/proposal-export-namespace-from',
      // '@babel/proposal-function-bind',
      // '@babel/proposal-function-sent',
      // '@babel/proposal-json-strings',
      // '@babel/proposal-logical-assignment-operators',
      // '@babel/proposal-nullish-coalescing-operator',
      // '@babel/proposal-numeric-separator',
      // '@babel/proposal-optional-chaining',
      // // '@babel/proposal-pipeline-operator',
      // '@babel/proposal-throw-expressions',
      // '@babel/syntax-dynamic-import',
      // '@babel/syntax-import-meta',
    ],
  }).code
}
