import { declare } from '@babel/helper-plugin-utils'
import { types as t, ConfigAPI, PluginObj } from '@babel/core'

export default declare(
  (api: ConfigAPI): PluginObj => {
    api.assertVersion(7)
    return {
      name: '@wana/babel-plugin-add-react-displayname',
      visitor: {
        Program(path) {
          const { node } = path

          const imports = node.body.filter(
            isImportNamed('wana')
          ) as t.ImportDeclaration[]

          if (!imports.length) return
          const match = imports.find(hasImportSpecifier('withAuto'))

          if (!match) return
          path.get('body').forEach(path => {
            let { node } = path

            // Coerce "export const" to "const"
            if (t.isExportNamedDeclaration(node)) {
              if (!(node = node.declaration!)) return
            }

            // Find variables that call "withAuto"
            if (t.isVariableDeclaration(node)) {
              const variables = node.declarations.filter(
                node =>
                  node.init &&
                  t.isIdentifier(node.id) &&
                  hasCallee(node.init, 'withAuto')
              )
              for (const variable of variables) {
                const ident = variable.id as t.Identifier
                path.insertAfter(
                  t.expressionStatement(
                    t.assignmentExpression(
                      '=',
                      t.memberExpression(ident, t.identifier('displayName')),
                      t.stringLiteral(ident.name)
                    )
                  )
                )
              }
            }
          })
        },
      },
    }
  }
)

function hasImportSpecifier(name: string) {
  return (node: t.ImportDeclaration) =>
    node.specifiers.find(
      node =>
        t.isImportSpecifier(node) && t.isIdentifier(node.imported, { name })
    )
}

function isImportNamed(value: string) {
  return (node: t.Node) =>
    t.isImportDeclaration(node) && t.isLiteral(node.source, { value })
}

function hasCallee(node: t.Node, name: string) {
  return (
    t.isCallExpression(node) &&
    (t.isIdentifier(node.callee, { name }) ||
      node.arguments.some(arg => hasCallee(arg, name)))
  )
}
