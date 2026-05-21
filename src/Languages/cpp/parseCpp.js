const { getParser, extractAST } = require("../parserUtils");
const CppLang = require("tree-sitter-cpp");

async function parseCppUsingTreeSitter(code) {
    try {
        const parser = getParser(CppLang);
        const tree = parser.parse(code);
        if (!tree || !tree.rootNode) return null;

        const extracted = {
            ClassSpecifier: [],
            FunctionDefinition: [],
            ConstructorDeclaration: [],
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

module.exports = { parseCppUsingTreeSitter };
