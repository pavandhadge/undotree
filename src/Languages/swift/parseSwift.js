const { getParser, extractAST } = require("../parserUtils");
const SwiftLang = require("tree-sitter-swift");

async function parseSwiftUsingTreeSitter(swiftCode) {
    try {
        const parser = getParser(SwiftLang);
        const tree = parser.parse(swiftCode);
        if (!tree || !tree.rootNode) return null;

        const extracted = {
            FunctionDeclaration: [],
            ClassDeclaration: [],
            StructDeclaration: [],
            IfStatement: [],
            ForStatement: [],
            WhileStatement: [],
            RepeatWhileStatement: [],
            VariableDeclaration: [],
            MethodCall: [],
        };

        extractAST(tree.rootNode, swiftCode, extracted);
        return { ast: tree, extracted };
    } catch (e) {
        return null;
    }
}

module.exports = { parseSwiftUsingTreeSitter };
