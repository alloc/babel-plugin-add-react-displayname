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
  if (shouldSetDisplayNameForFuncExpr(path)) {
    const id = findCandidateNameForExpression(path)
    if (id) {
      setDisplayNameAfter(path, id)
    }
  }
}

function shouldSetDisplayNameForFuncExpr(
  funcPath: NodePath<t.FunctionExpression | t.ArrowFunctionExpression>
) {
  const parentNode = funcPath.parentPath.node
  if (t.isVariableDeclarator(parentNode)) {
    // Ignore plain function components, like "const Foo = () => { ... }"
    return false
  }
  if (t.isCallExpression(parentNode) && parentNode.callee == funcPath.node) {
    // Ignore IIFEs that return JSX, like "(() => { ... })()"
    return false
  }

  // Parent must be either 'AssignmentExpression' or 'VariableDeclarator' or 'CallExpression' with a parent of 'VariableDeclarator'
  let id

  // Find our "VariableDeclarator" ancestor, if one exists.
  let path = funcPath.parentPath
  while (!t.isVariableDeclarator(path.node)) {
    if (t.isProgram(path.node) || t.isObjectProperty(path.node)) {
      return false
    }
    path = path.parentPath
  }

  const grandPath = path.parentPath.parentPath
  if (
    t.isProgram(grandPath.node) ||
    t.isExportNamedDeclaration(grandPath.node)
  ) {
    id = path.node.id
  }

  if (id) {
    return doesReturnJSX(funcPath.node.body)
  }

  return false
}

// https://github.com/babel/babel/blob/master/packages/babel-plugin-transform-react-display-name/src/index.js#L62-L77
// crawl up the ancestry looking for possible candidates for displayName inference
function findCandidateNameForExpression(path: NodePath) {
  let id
  path.find(path => {
    if (path.isAssignmentExpression()) {
      id = path.node.left
      // } else if (path.isObjectProperty()) {
      // id = path.node.key;
    } else if (path.isVariableDeclarator()) {
      id = path.node.id
    } else if (path.isStatement()) {
      // we've hit a statement, we should stop crawling up
      return true
    }

    // we've got an id! no need to continue
    return !!id
  })
  return id
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

function setDisplayNameAfter(
  path: NodePath,
  nameNodeId: t.Identifier,
  displayName = nameNodeId.name
) {
  const blockPath = path.find(path => path.parentPath.isBlock())
  if (blockPath) {
    const expr = t.expressionStatement(
      t.assignmentExpression(
        '=',
        t.memberExpression(nameNodeId, t.identifier('displayName')),
        t.stringLiteral(displayName)
      )
    )
    expr.trailingComments = blockPath.node.trailingComments
    delete blockPath.node.trailingComments
    blockPath.insertAfter(expr)
  }
}
