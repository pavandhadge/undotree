const { getParser, extractAST } = require("../parserUtils");
const PHPLang = require("tree-sitter-php");

async function parsePHPUsingTreeSitter(code) {
    try {
        const parser = getParser(PHPLang.php || PHPLang);
        const tree = parser.parse(code);
        if (!tree || !tree.rootNode) return null;

        const extracted = {
            function_definition: [],
            FunctionDeclaration: [],
            ClassDeclaration: [],
            MethodDeclaration: [],
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

module.exports = { parsePHPUsingTreeSitter };
