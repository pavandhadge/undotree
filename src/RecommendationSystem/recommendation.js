const { smartSimilarity } = require("./similarityIndex");
const { getFuncRecommendations, getLanguage, getFramework } = require("../Config/configStore");

function flattenExtracted(extracted) {
  if (!extracted || typeof extracted !== "object") return [];

  return Object.values(extracted)
    .flat()
    .filter((element) => element && element.ast && typeof element.code === "string" && element.code.trim().length > 0);
}

function getCandidateEntries(parsedData, selectedText) {
  const extractedEntries = flattenExtracted(parsedData?.extracted);
  if (extractedEntries.length > 0) {
    const selectedTrimmed = selectedText?.trim();
    const exactEntry = extractedEntries.find((entry) => entry.code.trim() === selectedTrimmed);

    if (exactEntry) return [exactEntry];

    return extractedEntries.sort((a, b) => b.code.length - a.code.length);
  }

  const candidateNode = getCandidateNode(parsedData);
  return candidateNode ? [{ ast: candidateNode, code: selectedText || "" }] : [];
}

function isWholeFileMatch(elementCode, nodeState, selectedText) {
  const code = elementCode.trim();
  const state = (nodeState || "").trim();
  const selection = (selectedText || "").trim();

  return code.length > 0 && code === state && code !== selection;
}

async function dfsIterative(startNode, candidates, parseFn, selectedText) {
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

    const candidateArray = flattenExtracted(extracted);
    candidateArray.forEach((element) => {
      if (!element || !element.ast || !element.code) return;
      if (isWholeFileMatch(element.code, node.state, selectedText)) return;

      const result = Math.max(...candidates.map((candidate) => smartSimilarity(element, candidate)));
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
  return suggestions;
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

async function recommendation(rootNode, parsedData, selectedText = "") {
  const candidates = getCandidateEntries(parsedData, selectedText);
  if (candidates.length === 0) {
    return [];
  }

  const language = getLanguage();
  const framework = getFramework();

  const parseFn = language ? async (code) => {
    const { parseCode } = require("../parse.js");
    return parseCode(language, framework, code);
  } : null;

  return dfsIterative(rootNode, candidates, parseFn, selectedText);
}

module.exports = { recommendation };
