const { getParser, extractAST } = require("../parserUtils");
const HTMLLang = require("tree-sitter-html");

async function parseHTMLWithEmbeddedUsingTreeSitter(htmlCode) {
    try {
        const parser = getParser(HTMLLang);
        const tree = parser.parse(htmlCode);
        if (!tree || !tree.rootNode) return null;

        const extracted = {
            element: [],
            script_element: [],
            style_element: [],
        };

        extractAST(tree.rootNode, htmlCode, extracted);
        return { ast: tree, extracted };
    } catch (e) {
        return null;
    }
}

module.exports = { parseHTMLWithEmbeddedUsingTreeSitter };
