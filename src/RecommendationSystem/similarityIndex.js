const { treeEditDistance } = require("./treeEditDistance")
const { nodeFrequencySimilarity } = require("./nodeFrequencyMatching")
const { semanticSimilarity, getNodeCategory, getEntryName } = require("./semanticSimilarity")

function clamp(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
}

function normalizeText(value) {
    return String(value || "")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function normalizeName(value) {
    return normalizeText(value).replace(/\s+/g, "");
}

function tokenize(value) {
    const normalized = normalizeText(value);
    return normalized ? normalized.split(/\s+/) : [];
}

function jaccard(left, right) {
    const leftSet = new Set(left.filter(Boolean));
    const rightSet = new Set(right.filter(Boolean));

    if (leftSet.size === 0 && rightSet.size === 0) return 1;
    if (leftSet.size === 0 || rightSet.size === 0) return 0;

    let intersection = 0;
    leftSet.forEach((item) => {
        if (rightSet.has(item)) intersection++;
    });

    return intersection / new Set([...leftSet, ...rightSet]).size;
}

function sequenceSimilarity(left, right) {
    if (left.length === 0 && right.length === 0) return 1;
    if (left.length === 0 || right.length === 0) return 0;

    const dp = Array(left.length + 1)
        .fill(null)
        .map(() => Array(right.length + 1).fill(0));

    for (let i = 1; i <= left.length; i++) {
        for (let j = 1; j <= right.length; j++) {
            if (left[i - 1] === right[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    return dp[left.length][right.length] / Math.max(left.length, right.length);
}

function codeLines(code) {
    return String(code || "")
        .split(/\r?\n/)
        .map((line) => normalizeText(line))
        .filter(Boolean);
}

function textSimilarity(code1, code2) {
    const left = String(code1 || "").trim();
    const right = String(code2 || "").trim();
    if (!left && !right) return 1;
    if (!left || !right) return 0;
    if (left === right) return 1;

    const leftTokens = tokenize(left);
    const rightTokens = tokenize(right);
    const tokenSetScore = jaccard(leftTokens, rightTokens);
    const tokenOrderScore = sequenceSimilarity(leftTokens, rightTokens);
    const lineScore = sequenceSimilarity(codeLines(left), codeLines(right));
    const lengthRatio = Math.min(left.length, right.length) / Math.max(left.length, right.length);

    return clamp((tokenSetScore * 0.35) + (tokenOrderScore * 0.35) + (lineScore * 0.15) + (lengthRatio * 0.15));
}

function extractSignature(entry) {
    const code = String(entry?.code || "");
    const ast = entry?.ast || {};
    const header = code.split(/\{|\n/)[0] || code;
    const paramsMatch = header.match(/\(([^()]*)\)/);
    const params = paramsMatch
        ? paramsMatch[1]
            .split(",")
            .map((param) => normalizeText(param.replace(/=.*/, "").replace(/:.*/, "")))
            .filter(Boolean)
        : [];

    let returnType = "";
    const explicitReturn = header.match(/\)\s*(?:->|:)\s*([A-Za-z_][A-Za-z0-9_<>,\s\[\].|?]*)/);
    if (explicitReturn) returnType = normalizeText(explicitReturn[1]);
    if (!returnType && ast.returnType?.typeAnnotation?.type) returnType = normalizeText(ast.returnType.typeAnnotation.type);
    if (!returnType && ast.returnType?.type) returnType = normalizeText(ast.returnType.type);
    if (!returnType && ast.result?.type) returnType = normalizeText(ast.result.type);

    return {
        params,
        paramCount: params.length,
        returnType,
        async: /\basync\b/.test(header) || Boolean(ast.async),
    };
}

function signatureSimilarity(entry1, entry2) {
    const left = extractSignature(entry1);
    const right = extractSignature(entry2);
    const maxParams = Math.max(left.paramCount, right.paramCount, 1);
    const countScore = 1 - Math.abs(left.paramCount - right.paramCount) / maxParams;
    const paramNameScore = left.paramCount || right.paramCount ? jaccard(left.params, right.params) : 0.75;
    const returnScore = left.returnType || right.returnType
        ? (left.returnType === right.returnType ? 1 : jaccard(tokenize(left.returnType), tokenize(right.returnType)))
        : 0.75;
    const asyncScore = left.async === right.async ? 1 : 0;

    return clamp((countScore * 0.35) + (paramNameScore * 0.3) + (returnScore * 0.25) + (asyncScore * 0.1));
}

function symbolIdentityScore(entry1, entry2, semantic, category1, category2) {
    if (category1 !== category2) return 0;

    const name1 = getEntryName(entry1);
    const name2 = getEntryName(entry2);
    const normalized1 = normalizeName(name1);
    const normalized2 = normalizeName(name2);
    const hasUsableName = normalized1 && normalized2 && normalized1 !== "anonymous" && normalized2 !== "anonymous";

    if (!hasUsableName) {
        return category1 === category2 ? 0.35 : 0;
    }

    const exactNameScore = normalized1 === normalized2 ? 1 : 0;
    const tokenNameScore = jaccard(tokenize(name1), tokenize(name2));
    const nameScore = Math.max(exactNameScore, tokenNameScore, semantic.nameScore || 0);
    const signatureScore = signatureSimilarity(entry1, entry2);

    return clamp((nameScore * 0.75) + (signatureScore * 0.25));
}

function sizeCompatibility(code1, code2) {
    const leftLength = String(code1 || "").trim().length;
    const rightLength = String(code2 || "").trim().length;
    if (leftLength === 0 || rightLength === 0) return 0;
    return Math.min(leftLength, rightLength) / Math.max(leftLength, rightLength);
}

/**
 * Combines structural AST similarity from tree edit distance and node-type
 * frequency. This is intentionally only one part of the final ranker because
 * unrelated snippets can have similar syntax shapes.
 */
function similarityIndex(node1, node2, alpha = 0.5) {
    const tedScore = treeEditDistance(node1, node2);
    const freqScore = nodeFrequencySimilarity(node1, node2);

    return alpha * tedScore + (1 - alpha) * freqScore;
}

/**
 * Backward-compatible numeric score wrapper.
 */
function smartSimilarity(entry1, entry2) {
    return smartSimilarityDetailed(entry1, entry2).score;
}

/**
 * Main recommendation ranker. It combines symbol identity, name similarity,
 * function signature similarity, text overlap/order, semantic AST features,
 * structural AST similarity, recency, and size compatibility.
 */
function smartSimilarityDetailed(entry1, entry2, options = {}) {
    const category1 = getNodeCategory(entry1.ast);
    const category2 = getNodeCategory(entry2.ast);

    if (category1 !== category2) {
        if (category1 === "function" || category2 === "function") {
            return {
                score: 0,
                reasons: { category: 0 },
            };
        }
    }

    const astScore = similarityIndex(entry1.ast, entry2.ast, 0.55);
    const semantic = semanticSimilarity(entry1, entry2);
    const textScore = textSimilarity(entry1.code, entry2.code);
    const signatureScore = signatureSimilarity(entry1, entry2);
    const symbolScore = symbolIdentityScore(entry1, entry2, semantic, category1, category2);
    const recencyScore = clamp(options.recencyScore ?? 0.5);
    const sizeScore = sizeCompatibility(entry1.code, entry2.code);

    let score;
    if (category1 === "function") {
        score = (symbolScore * 0.22) +
            (semantic.nameScore * 0.18) +
            (signatureScore * 0.14) +
            (textScore * 0.17) +
            (semantic.score * 0.14) +
            (astScore * 0.1) +
            (recencyScore * 0.05);
    } else if (category1 === "import") {
        score = (textScore * 0.45) + (semantic.score * 0.3) + (astScore * 0.15) + (recencyScore * 0.1);
    } else {
        score = (textScore * 0.4) +
            (semantic.score * 0.3) +
            (astScore * 0.2) +
            (recencyScore * 0.1);
    }

    if (semantic.hasName && semantic.nameScore < 0.35) {
        score *= category1 === "function" ? 0.45 : 0.65;
    } else if (semantic.hasName && semantic.nameScore < 0.55) {
        score *= 0.75;
    } else if (semantic.hasName && semantic.nameScore > 0.95) {
        score = Math.min(1, score * 1.08);
    }

    if (semantic.structureScore < 0.35) {
        score *= 0.75;
    }

    if (sizeScore < 0.25 && symbolScore < 0.75) {
        score *= 0.65;
    }

    return {
        score: clamp(score),
        reasons: {
            category: category1 === category2 ? 1 : 0.4,
            symbol: symbolScore,
            name: semantic.nameScore,
            signature: signatureScore,
            text: textScore,
            semantic: semantic.score,
            ast: astScore,
            recency: recencyScore,
            size: sizeScore,
            structure: semantic.structureScore,
        },
    };
}

module.exports = { similarityIndex, smartSimilarity, smartSimilarityDetailed }
