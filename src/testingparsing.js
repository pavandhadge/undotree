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
  const ast = acorn.parse(code, { ecmaVersion: 'latest' });
  const functions = [];
  const classes = [];

  walk.simple(ast, {
    FunctionDeclaration(node) {
      // console.log("what a node contains : ",node)
      const functionBody = code.substring(node.body.start, node.body.end);
      const normalisedBody = normalizeCode(functionBody);
      functions.push({ name: node.id ? node.id.name : node.type, code: functionBody , normalizedBody : normalisedBody });
    },
    FunctionExpression(node) {
      // console.log("what a node contains : ",node)
      const functionBody = code.substring(node.body.start, node.body.end);
      const normalisedBody = normalizeCode(functionBody);
      functions.push({ name: node.id ? node.id.name : node.type, code: functionBody , normalisedBody : normalisedBody});
    },
    ArrowFunctionExpression(node) {
      // console.log("what a node contains : ",node)
      const functionBody = code.substring(node.body.start, node.body.end);
      const normalisedBody = normalizeCode(functionBody);
      functions.push({ name: node.type, code: functionBody ,normalisedBody : normalisedBody});
    },
    ClassDeclaration(node) {

      // console.log("what a node contains : ",node)
      const classBody = code.substring(node.body.start, node.body.end);
      const normalisedBody = normalizeCode(classBody);
      classes.push({ name: node.id ? node.id.name : node.type, code: classBody ,normalisedBody : normalisedBody });
    },
    ClassExpression(node) {
      // console.log("what a node contains : ",node)
      const classBody = code.substring(node.body.start, node.body.end);
      const normalisedBody = normalizeCode(classBody);
      classes.push({ name: node.id ? node.id.name : node.type, code: classBody , normalisedBody : normalisedBody });
    }
  });
  console.log("checking func , class : ",functions , classes);
  return {functions,classes}
  // return result;
}







module.exports = {
  parseJavaScript,

}