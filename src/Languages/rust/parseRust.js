const { getParser, extractAST } = require("../parserUtils");
const RustLang = require("tree-sitter-rust");

async function parseRustUsingTreeSitter(code) {
    try {
        const parser = getParser(RustLang);
        const tree = parser.parse(code);
        if (!tree || !tree.rootNode) return null;

        const extracted = {
            FunctionItem: [],
            StructItem: [],
            ImplItem: [],
            LetDeclaration: [],
            IfExpression: [],
            WhileExpression: [],
            ForExpression: [],
            MatchExpression: [],
            ReturnStatement: [],
            ExpressionStatement: [],
        };

        extractAST(tree.rootNode, code, extracted);
        return { ast: tree, extracted };
    } catch (e) {
        return null;
    }
}

module.exports = { parseRustUsingTreeSitter };
