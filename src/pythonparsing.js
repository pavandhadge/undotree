const ast = require('python-ast');

function normalizeCode(code) {
  let normalized = code.replace(/#.*$/gm, ''); // Remove comments
  normalized = normalized.replace(/\s+/g, ' ').trim(); // Normalize whitespace
  return normalized;
}

function parsePythonCode(code) {
  const pythonAST = ast.parse(code);
  const functions = [];
  const classes = [];
    console.log(pythonAST)
  function traverse(node) {
    if (node.type === 'FunctionDef') {
      const functionBody = code.substring(node.lineno, node.end_lineno);
      const normalizedBody = normalizeCode(functionBody);
      functions.push({
        name: node.name,
        code: functionBody,
        normalizedBody: normalizedBody
      });
    } else if (node.type === 'ClassDef') {
      const classBody = code.substring(node.lineno, node.end_lineno);
      const normalizedBody = normalizeCode(classBody);
      classes.push({
        name: node.name,
        code: classBody,
        normalizedBody: normalizedBody
      });
    }

    // Recursively traverse child nodes
    if (node.body) {
      node.body.forEach(traverse);
    }
  }

  traverse(pythonAST);

  return { functions, classes };
}

// Example usage
const pythonCode = `
class TreeNode:
    def __init__(self, state, hash, datetime, count, parent=None):
        self.state = state
        self.children = []
        self.parent = parent
        self.hash = hash
        self.datetime = datetime
        self.count = count

    def add_child(self, child_node):
        if isinstance(child_node, TreeNode):
            child_node.parent = self
            self.children.append(child_node)
        else:
            raise ValueError('Invalid child node')
`;

const result = parsePythonCode(pythonCode);
console.log(result);
