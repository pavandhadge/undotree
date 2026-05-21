const { getParser, extractAST } = require("../parserUtils");
const CSSLang = require("tree-sitter-css");

async function parseCssUsingTreeSitter(cssCode) {
    try {
        const parser = getParser(CSSLang);
        const tree = parser.parse(cssCode);
        if (!tree || !tree.rootNode) return null;

        const extracted = {
            selectors: [],
            properties: [],
            fullRules: [],
        };

        extractAST(tree.rootNode, cssCode, extracted);
        return { ast: tree, extracted };
    } catch (e) {
        return null;
    }
}

module.exports = { parseCssUsingTreeSitter };
