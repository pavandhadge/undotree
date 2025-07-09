const { similarityIndex } = require("./similarityIndex");
const { getFuncRecommendations } = require("../Config/configStore");

function dfsIterative(startNode, candidates, candidateType, threshold, maxResults, maxDepth = 100) {
  if (!startNode) return [];
  const stack = [{ node: startNode, depth: 0 }];
  const suggestions = new Set(); // Use Set to deduplicate
  while (stack.length > 0 && (!maxResults || suggestions.size < maxResults)) {
    const { node, depth } = stack.pop();
    if (depth > maxDepth) continue; // Do not process or traverse beyond maxDepth
    // Only process this node if within maxDepth
    const candidateArray = node.parsed?.extracted[candidateType] || [];
    candidateArray.forEach((element) => {
      for (const candidate of candidates) {
        const result = similarityIndex(element.ast, candidate);
        // Always check threshold strictly
        if (typeof result === "number" && result >= threshold) {
          suggestions.add(element.code);
          if (maxResults && suggestions.size >= maxResults) break;
        }
      }
    });
    // Only traverse children if next depth is within maxDepth
    if (depth + 1 <= maxDepth && node.children) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push({ node: node.children[i], depth: depth + 1 });
      }
    }
  }
  return Array.from(suggestions);
}

function recommendation(rootNode, parsedData) {
  if (!parsedData.ast.body.length) return [];
  const funcRecommendations = getFuncRecommendations() || {};
  const threshold = typeof funcRecommendations["threshold"] === "number" ? funcRecommendations["threshold"] : 0.1;
  const maxResults =
    typeof funcRecommendations["maxResults"] === "number" ? funcRecommendations["maxResults"] : undefined;
  const maxDepth = typeof funcRecommendations["maxDepth"] === "number" ? funcRecommendations["maxDepth"] : 100;
  // Compare all top-level nodes in the selection
  const candidates = parsedData.ast.body;
  const candidateType = candidates[0].type; // Assume all are same type for now
  return dfsIterative(rootNode, candidates, candidateType, threshold, maxResults, maxDepth);
}

module.exports = { recommendation };
