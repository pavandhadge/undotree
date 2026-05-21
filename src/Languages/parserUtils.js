const Parser = require("tree-sitter");

const parserCache = new Map();

function getParser(languageModule) {
    const cacheKey = languageModule.name || languageModule.constructor.name;
    if (!parserCache.has(cacheKey)) {
        const parser = new Parser();
        parser.setLanguage(languageModule);
        parserCache.set(cacheKey, parser);
    }
    return parserCache.get(cacheKey);
}

function extractCode(node, sourceCode) {
    if (!node || typeof node.startIndex !== 'number' || typeof node.endIndex !== 'number') {
        return "";
    }

    const start = node.startIndex;
    const end = node.endIndex;

    if (start < 0 || end > sourceCode.length || start > end) {
        return "";
    }

    return sourceCode.slice(start, end);
}

function extractAST(node, sourceCode, extracted) {
    if (!node) return;

    if (node.type in extracted) {
        const entry = {
            code: extractCode(node, sourceCode),
            ast: node,
        };
        extracted[node.type].push(entry);
    }

    for (let i = 0; i < node.childCount; i++) {
        extractAST(node.child(i), sourceCode, extracted);
    }
}

function convertToRecommendationFormat(node) {
    if (!node) return null;

    return {
        type: node.type,
        text: node.text || "",
        children: node.children ? node.children.map(convertToRecommendationFormat) : [],
    };
}

module.exports = { getParser, extractCode, extractAST, convertToRecommendationFormat };
