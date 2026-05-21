const { getParser, extractAST } = require("../parserUtils");
const KotlinLang = require("tree-sitter-kotlin");

async function parseKotlinUsingTreeSitter(kotlinCode) {
    try {
        const parser = getParser(KotlinLang);
        const tree = parser.parse(kotlinCode);
        if (!tree || !tree.rootNode) return null;

        const extracted = {
            FunctionDeclaration: [],
            ClassDeclaration: [],
            ObjectDeclaration: [],
            IfStatement: [],
            WhileStatement: [],
            ForStatement: [],
            VariableAssignment: [],
            FunctionCall: [],
        };

        extractAST(tree.rootNode, kotlinCode, extracted);
        return { ast: tree, extracted };
    } catch (e) {
        return null;
    }
}

module.exports = { parseKotlinUsingTreeSitter };
