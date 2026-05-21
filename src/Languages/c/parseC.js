const { getParser, extractAST } = require("../parserUtils");
const CLang = require("tree-sitter-c");

async function parseCUsingTreeSitter(code) {
    try {
        const parser = getParser(CLang);
        const tree = parser.parse(code);
        if (!tree || !tree.rootNode) return null;

        const extracted = {
            FunctionDefinition: [],
            StructSpecifier: [],
            VariableDeclaration: [],
            IfStatement: [],
            WhileStatement: [],
            ForStatement: [],
            SwitchStatement: [],
            ReturnStatement: [],
            ExpressionStatement: [],
        };

        extractAST(tree.rootNode, code, extracted);
        return { ast: tree, extracted };
    } catch (e) {
        return null;
    }
}

module.exports = { parseCUsingTreeSitter };
