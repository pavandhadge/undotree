const { getParser, extractAST } = require("../parserUtils");
const CSharpLang = require("tree-sitter-c-sharp");

async function parseCSharpUsingTreeSitter(code) {
    try {
        const parser = getParser(CSharpLang);
        const tree = parser.parse(code);
        if (!tree || !tree.rootNode) return null;

        const extracted = {
            LocalFunctionStatement: [],
            MethodDeclaration: [],
            ClassDeclaration: [],
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

module.exports = { parseCSharpUsingTreeSitter };
