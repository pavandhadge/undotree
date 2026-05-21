const { treeEditDistance } = require("./treeEditDistance")
const { nodeFrequencySimilarity } = require("./nodeFrequencyMatching")
const { semanticSimilarity, getNodeCategory } = require("./semanticSimilarity")

function similarityIndex(node1, node2, alpha = 0.5) {
    const tedScore = treeEditDistance(node1, node2);
    const freqScore = nodeFrequencySimilarity(node1, node2);

    return alpha * tedScore + (1 - alpha) * freqScore;
}

function smartSimilarity(entry1, entry2) {
    const category1 = getNodeCategory(entry1.ast);
    const category2 = getNodeCategory(entry2.ast);

    if (category1 !== category2) {
        if (category1 === "function" || category2 === "function") return 0;
    }

    const astScore = similarityIndex(entry1.ast, entry2.ast, 0.55);
    const semantic = semanticSimilarity(entry1, entry2);
    const semanticWeight = category1 === "function" ? 0.55 : 0.75;
    let score = astScore * (1 - semanticWeight) + semantic.score * semanticWeight;

    if (semantic.hasName && semantic.nameScore < 0.35) {
        score *= 0.55;
    } else if (semantic.hasName && semantic.nameScore < 0.55) {
        score *= 0.75;
    } else if (semantic.hasName && semantic.nameScore > 0.95) {
        score = Math.min(1, score * 1.08);
    }

    if (semantic.structureScore < 0.35) {
        score *= 0.75;
    }

    return Math.max(0, Math.min(1, score));
}

module.exports = { similarityIndex, smartSimilarity }
