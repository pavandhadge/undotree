const swc = require("@swc/core");

async function parseJsUsingSWC(code, config = null) {
  try {
    const ast = await swc.parseSync(code, config || {
      syntax: "ecmascript",
      jsx: true,
      isModule: true,
      dynamicImport: true,
      minify: false,
      preserveAllComments: true,
    });

    if (ast) {
      const minSpanStart = getMinSpanStart(ast);

      const extracted = {
        FunctionDeclaration: [],
        FunctionExpression: [],
        ImportDeclaration: [],
        VariableDeclaration: [],
        IfStatement: [],
        ForStatement: [],
        WhileStatement: [],
        DoWhileStatement: [],
        ClassDeclaration: [],
        ReturnStatement: [],
        TryStatement: [],
        ExpressionStatement: [],
        SwitchStatement: [],
      };

      extractAST(ast, code, minSpanStart, extracted);

      return { ast, extracted };
    }
  } catch (e) {
    return null;
  }
}

function getMinSpanStart(node) {
  let minStart = Infinity;

  function traverse(n) {
    if (!n) return;
    if (n.span && n.span.start < minStart) {
      minStart = n.span.start;
    }

    for (const key in n) {
      if (typeof n[key] === "object" && n[key] !== null) {
        if (Array.isArray(n[key])) {
          n[key].forEach((child) => traverse(child));
        } else {
          traverse(n[key]);
        }
      }
    }
  }

  traverse(node);
  return minStart === Infinity ? 0 : minStart;
}

const extractCode = (n, code, minSpanStart) => {
  try {
    if (!n.span) return "";

    const start = n.span.start - minSpanStart;
    const end = n.span.end - minSpanStart;

    if (start < 0 || end > code.length) {
      return "";
    }

    return code.slice(start, end);
  } catch (error) {
    return "";
  }
};

function extractAST(node, code, minSpanStart, extracted) {
  if (!node) return;

  if (node.type in extracted) {
    const entry = {
      code: extractCode(node, code, minSpanStart),
      ast: node,
    };

    if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression") {
      entry.name = node.identifier ? node.identifier.value : "anonymous";
    }
    if (node.type === "ImportDeclaration") {
      entry.source = node.source?.value || "";
    }
    if (node.type === "VariableDeclaration") {
      entry.kind = node.kind;
    }
    if (node.type === "IfStatement") {
      entry.condition = extractCode(node.test, code, minSpanStart);
    }
    if (node.type === "TryStatement") {
      entry.tryBlock = extractCode(node.block, code, minSpanStart);
      entry.catchBlock = node.handler ? extractCode(node.handler, code, minSpanStart) : null;
    }
    if (node.type === "SwitchStatement") {
      entry.discriminant = extractCode(node.discriminant, code, minSpanStart);
    }

    extracted[node.type].push(entry);
  }

  for (const key in node) {
    if (typeof node[key] === "object" && node[key] !== null) {
      if (Array.isArray(node[key])) {
        node[key].forEach((child) => extractAST(child, code, minSpanStart, extracted));
      } else {
        extractAST(node[key], code, minSpanStart, extracted);
      }
    }
  }
}

module.exports = { parseJsUsingSWC };
