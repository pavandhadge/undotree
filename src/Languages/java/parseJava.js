const { getParser, extractAST } = require("../parserUtils");
const JavaLang = require("tree-sitter-java");

async function parseJavaUsingTreeSitter(code) {
    try {
        const parser = getParser(JavaLang);
        const tree = parser.parse(code);
        if (!tree || !tree.rootNode) return null;

        const extracted = {
            ClassDeclaration: [],
            MethodDeclaration: [],
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

module.exports = { parseJavaUsingTreeSitter };
