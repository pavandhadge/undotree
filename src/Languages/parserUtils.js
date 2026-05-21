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

function normalizeType(type) {
    return String(type || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getExtractionKey(nodeType, extracted) {
    if (nodeType in extracted) return nodeType;

    const normalizedNodeType = normalizeType(nodeType);
    return Object.keys(extracted).find((key) => normalizeType(key) === normalizedNodeType) || null;
}

function getNodeName(node, depth = 0) {
    if (!node || depth > 4) return "";

    if (["identifier", "property_identifier", "field_identifier", "type_identifier", "tag_name", "class_name", "id_name", "property_name"].includes(node.type) && node.text) {
        return node.text;
    }

    if (node.type === "element" && node.text) {
        const tag = node.text.match(/^<\s*([A-Za-z0-9:_-]+)/)?.[1] || "";
        const id = node.text.match(/\bid=["']([^"']+)["']/)?.[1] || "";
        const className = node.text.match(/\bclass(?:Name)?=["']([^"']+)["']/)?.[1] || "";
        return [tag, id, className].filter(Boolean).join(" ");
    }

    if ((node.type === "rule_set" || node.type === "selectors") && node.text) {
        return node.text.split("{")[0].trim();
    }

    if (node.type === "declaration" && node.text) {
        return node.text.split(":")[0].trim();
    }

    if (typeof node.childForFieldName !== "function") return "";

    const nameNode = node.childForFieldName("name");
    if (nameNode?.text) return nameNode.text;

    const declarator = node.childForFieldName("declarator");
    const declaratorName = getNodeName(declarator, depth + 1);
    if (declaratorName) return declaratorName;

    for (let i = 0; i < node.childCount; i++) {
        const childName = getNodeName(node.child(i), depth + 1);
        if (childName) return childName;
    }

    return "";
}

function extractAST(node, sourceCode, extracted) {
    if (!node) return;

    const extractionKey = getExtractionKey(node.type, extracted);
    if (extractionKey) {
        const entry = {
            code: extractCode(node, sourceCode),
            ast: node,
        };
        const name = getNodeName(node);
        if (name) entry.name = name;

        extracted[extractionKey].push(entry);
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
