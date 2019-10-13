import { declare } from '@babel/helper-plugin-utils'
import { types as t, ConfigAPI, PluginObj, NodePath } from '@babel/core'

export default declare(
  (api: ConfigAPI): PluginObj => {
    api.assertVersion(7)
    return {
      name: '@wana/babel-plugin-add-react-displayname',
      visitor: {
        FunctionExpression(path) {
          setDisplayNameIfPossible(path)
        },
        ArrowFunctionExpression(path) {
          setDisplayNameIfPossible(path)
        },
      },
    }
  }
)

function setDisplayNameIfPossible(
  path: NodePath<t.FunctionExpression | t.ArrowFunctionExpression>
) {
  const prevStmt = findBlockChild(path)
  if (!prevStmt) return

  const displayName = inferDisplayName(path)
  if (!displayName) return

  try {
    const newStmt = t.expressionStatement(
      t.assignmentExpression(
        '=',
        t.memberExpression(
          t.identifier(displayName),
          t.identifier('displayName')
        ),
        t.stringLiteral(displayName)
      )
    )
    newStmt.trailingComments = prevStmt.node.trailingComments
    delete prevStmt.node.trailingComments
    prevStmt.insertAfter(newStmt)
  } catch (err) {
    debugger
  }
}

function findLeftValue(expr: NodePath<t.Expression>) {
  let path = expr.parentPath
  while (path) {
    if (path.isBlockParent() || path.isProperty()) {
      return
    }
    if (path.isAssignmentExpression()) {
      return path.node.left
    }
    if (path.isVariableDeclarator()) {
      return path.node.id
    }
    path = path.parentPath
  }
}

function findBlockChild(path: NodePath) {
  while (path.parentPath) {
    if (path.parentPath.isProperty()) {
      return
    }
    if (path.parentPath.isBlockParent()) {
      return path
    }
    path = path.parentPath
  }
}

function inferDisplayName(
  funcPath: NodePath<t.FunctionExpression | t.ArrowFunctionExpression>
) {
  const parentNode = funcPath.parentPath.node
  if (t.isVariableDeclarator(parentNode)) {
    // Ignore plain function components, like "const Foo = () => { ... }"
    return null
  }
  if (t.isCallExpression(parentNode) && parentNode.callee == funcPath.node) {
    // Ignore IIFEs that return JSX, like "(() => { ... })()"
    return null
  }
  if (doesReturnJSX(funcPath.node.body)) {
    const left = findLeftValue(funcPath)
    if (t.isIdentifier(left)) {
      return left.name
    }
  }
  return null
}

function doesReturnJSX(node: t.Expression | t.BlockStatement) {
  if (!node) return false
  if (t.isJSXElement(node)) {
    return true
  }

  if (t.isBlockStatement(node)) {
    const len = node.body.length
    if (len) {
      const lastNode = node.body[len - 1]
      if (t.isReturnStatement(lastNode)) {
        return lastNode.argument && t.isJSXElement(lastNode.argument)
      }
    }
  }

  return false
}
