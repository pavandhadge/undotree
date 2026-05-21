const { smartSimilarityDetailed } = require("./similarityIndex");
const { getFuncRecommendations, getLanguage, getFramework } = require("../Config/configStore");

function flattenExtracted(extracted) {
  if (!extracted || typeof extracted !== "object") return [];

  return Object.values(extracted)
    .flat()
    .filter((element) => element && element.ast && typeof element.code === "string" && element.code.trim().length > 0);
}

/**
 * Chooses the selected-code entries that historical snippets should be compared
 * against. Exact extracted matches are preferred; otherwise larger entries are
 * tried first so whole functions/components beat inner statements.
 */
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

function normalizeCodeForDedupe(code) {
  return String(code || "")
    .replace(/\s+/g, " ")
    .trim();
}

function getMaxNodeCount(startNode) {
  let maxCount = 0;
  const stack = startNode ? [startNode] : [];

  while (stack.length > 0) {
    const node = stack.pop();
    if (typeof node.count === "number" && node.count > maxCount) {
      maxCount = node.count;
    }

    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        stack.push(node.children[i]);
      }
    }
  }

  return maxCount;
}

function getRecencyScore(node, maxNodeCount) {
  if (typeof node?.count === "number" && maxNodeCount > 0) {
    return Math.max(0, Math.min(1, node.count / maxNodeCount));
  }

  return 0.5;
}

function getMaxSuggestions(funcRecommendations) {
  const parsed = Number.parseInt(funcRecommendations?.["max-suggestions"] ?? funcRecommendations?.maxSuggestions ?? "25", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 25;
}

/**
 * Lazy parsing is useful for speed but can retain many ASTs in long sessions.
 * Keep it opt-in so the default recommendation path stays memory bounded.
 */
function shouldCacheLazyParse(funcRecommendations) {
  return funcRecommendations?.["cache-parsed-history"] === true || funcRecommendations?.cacheParsedHistory === true;
}

/**
 * Finds the strongest match between one historical snippet and all selected
 * candidates. This supports selections that parse into more than one extracted
 * entry, while still returning one score for ranking.
 */
function bestCandidateMatch(element, candidates, recencyScore) {
  let best = { score: 0, reasons: {} };

  candidates.forEach((candidate) => {
    const result = smartSimilarityDetailed(element, candidate, { recencyScore });
    if (result.score > best.score) {
      best = result;
    }
  });

  return best;
}

/**
 * Walks the undo tree, parses states that do not already have extracted entries,
 * scores candidate snippets, deduplicates by normalized code, and returns compact
 * webview-safe suggestions capped by configuration.
 */
async function dfsIterative(startNode, candidates, parseFn, selectedText) {
  const funcRecommendations = getFuncRecommendations();
  if (!startNode) return [];

  const threshold = parseFloat(funcRecommendations?.["threshold"] ?? "0.7");
  const maxSuggestions = getMaxSuggestions(funcRecommendations);
  const cacheLazyParse = shouldCacheLazyParse(funcRecommendations);
  const maxNodeCount = getMaxNodeCount(startNode);
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
          if (cacheLazyParse) {
            node.parsed = parsed;
          }
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
    const recencyScore = getRecencyScore(node, maxNodeCount);
    candidateArray.forEach((element) => {
      if (!element || !element.ast || !element.code) return;
      if (isWholeFileMatch(element.code, node.state, selectedText)) return;

      const result = bestCandidateMatch(element, candidates, recencyScore);
      if (result.score >= threshold) {
        const codeKey = normalizeCodeForDedupe(element.code);
        if (codeKey.length > 0 && !seen.has(codeKey)) {
          seen.add(codeKey);
          suggestions.push({
            code: element.code,
            similarity: result.score,
            nodeCount: node.count,
          });
        }
      }
    });

    if (node.children) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i]);
      }
    }
  }

  suggestions.sort((a, b) => {
    if (b.similarity !== a.similarity) return b.similarity - a.similarity;
    return (b.nodeCount || 0) - (a.nodeCount || 0);
  });
  return suggestions.slice(0, maxSuggestions).map(({ code, similarity }) => ({ code, similarity }));
}

/**
 * Fallback for parsers that produce an AST but no `extracted` map.
 */
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

/**
 * Public recommendation entry point used by the VS Code command.
 */
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
