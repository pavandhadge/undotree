const { similarityIndex } = require("./similarityIndex");
const { getFuncRecommendations, getLanguage, getFramework } = require("../Config/configStore");

async function dfsIterative(startNode, candidate, candidateType, parseFn) {
  const funcRecommendations = getFuncRecommendations();
  if (!startNode) return [];

  const threshold = parseFloat(funcRecommendations?.["threshold"] ?? "0.7");
  const stack = [startNode];
  const suggestions = [];
  const seen = new Set();

  while (stack.length > 0) {
    const node = stack.pop();

    let extracted = node.parsed?.extracted;

    if (!extracted && node.state && parseFn) {
      try {
        const parsed = await parseFn(node.state);
        if (parsed && parsed.extracted) {
          extracted = parsed.extracted;
          node.parsed = parsed;
        }
      } catch (err) {
        // Skip this node if parsing fails
      }
    }

    if (!extracted) {
      if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          stack.push(node.children[i]);
        }
      }
      continue;
    }

    const candidateArray = extracted[candidateType] || [];
    candidateArray.forEach((element) => {
      if (!element || !element.ast || !element.code) return;

      const result = similarityIndex(element.ast, candidate);
      if (result >= threshold) {
        const codeKey = element.code.trim();
        if (codeKey.length > 0 && !seen.has(codeKey)) {
          seen.add(codeKey);
          suggestions.push({ code: element.code, similarity: result });
        }
      }
    });

    if (node.children) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i]);
      }
    }
  }

  suggestions.sort((a, b) => b.similarity - a.similarity);
  return suggestions.map((s) => s.code);
}

function getCandidateNode(parsedData) {
  if (!parsedData || !parsedData.ast) return null;

  if (parsedData.ast.body && parsedData.ast.body.length > 0) {
    return parsedData.ast.body[0];
  }

  if (parsedData.ast.rootNode && parsedData.ast.rootNode.children && parsedData.ast.rootNode.children.length > 0) {
    return parsedData.ast.rootNode.children[0];
  }

  if (parsedData.ast.children && parsedData.ast.children.length > 0) {
    return parsedData.ast.children[0];
  }

  return null;
}

async function recommendation(rootNode, parsedData) {
  const candidateNode = getCandidateNode(parsedData);
  if (!candidateNode) {
    return [];
  }

  const candidateType = candidateNode.type;

  const language = getLanguage();
  const framework = getFramework();

  const parseFn = language ? async (code) => {
    const { parseCode } = require("../parse.js");
    return parseCode(language, framework, code);
  } : null;

  return dfsIterative(rootNode, candidateNode, candidateType, parseFn);
}

module.exports = { recommendation };
