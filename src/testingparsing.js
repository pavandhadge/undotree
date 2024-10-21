// import { normalize } from 'path';
const normalize = require('path')
const acorn = require('acorn');
const walk = require('acorn-walk'); // Correct import for acorn-walk


function normalizeCode(code) {
  let normalized = code.replace(/\/\/[^\n]*\n/g, '\n');
  normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, '');
  normalized = normalized.toLowerCase();
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
}

function parseJavaScript(code) {
  const ast = acorn.parse(code, { ecmaVersion: 'latest', silent: true });
  const functions = [];
  const classes = [];
  const ifElseStatements = [];
  const forLoops = [];
  const switchStatements = [];

  walk.simple(ast, {
    FunctionDeclaration(node) {
      const functionBody = code.substring(node.start, node.end);
      const normalisedBody = normalizeCode(functionBody);
      const params = node.params.map(param => param.name); // Extract parameter names
      functions.push({
        name: node.id ? node.id.name : node.type,
        params,
        code: functionBody,
        normalisedBody
      });
    },
    FunctionExpression(node) {
      const functionBody = code.substring(node.start, node.end);
      const normalisedBody = normalizeCode(functionBody);
      const params = node.params.map(param => param.name); // Extract parameter names
      functions.push({
        name: node.id ? node.id.name : 'anonymous',
        params,
        code: functionBody,
        normalisedBody
      });
    },
    ArrowFunctionExpression(node) {
      const functionBody = code.substring(node.start, node.end);
      const normalisedBody = normalizeCode(functionBody);
      const params = node.params.map(param => param.name); // Extract parameter names
      functions.push({
        name: 'anonymous',
        params,
        code: functionBody,
        normalisedBody
      });
    },
    ClassDeclaration(node) {
      const classBody = code.substring(node.start, node.end);
      const normalisedBody = normalizeCode(classBody);
      classes.push({
        name: node.id ? node.id.name : 'anonymous',
        code: classBody,
        normalisedBody
      });
    },
    ClassExpression(node) {
      const classBody = code.substring(node.start, node.end);
      const normalisedBody = normalizeCode(classBody);
      classes.push({
        name: node.id ? node.id.name : 'anonymous',
        code: classBody,
        normalisedBody
      });
    },
    IfStatement(node) {
      const ifBody = code.substring(node.start, node.end);
      const normalisedBody = normalizeCode(ifBody);
      ifElseStatements.push({
        code: ifBody,
        normalisedBody
      });
    },
    ForStatement(node) {
      const forBody = code.substring(node.start, node.end);
      const normalisedBody = normalizeCode(forBody);
      forLoops.push({
        code: forBody,
        normalisedBody
      });
    },
    SwitchStatement(node) {
      const switchBody = code.substring(node.start, node.end);
      const normalisedBody = normalizeCode(switchBody);
      switchStatements.push({
        code: switchBody,
        normalisedBody
      });
    }
  });

  return { functions, classes, ifElseStatements, forLoops, switchStatements };
}


// const result = parseJavaScript(`class TreeNode {
//     constructor(state, hash, datetime, count, parent = null) {
//         this.state = state;
//         this.children = [];
//         this.parent = parent;
//         this.hash = hash;
//         this.datetime = datetime;
//         this.count = count;
//     }

//     addChild(childNode) {
//         if (childNode instanceof TreeNode) {
//             childNode.parent = this;
//             this.children.push(childNode);
//         } else {
//             throw new Error('Invalid child node');
//         }
//     }
// }

// module.exports = TreeNode;
// `);

// console.log(result)


module.exports = {
  parseJavaScript,

}