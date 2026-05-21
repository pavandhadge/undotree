const { getParser, extractAST } = require("../parserUtils");
const RubyLang = require("tree-sitter-ruby");

async function parseRubyUsingTreeSitter(rubyCode) {
    try {
        const parser = getParser(RubyLang);
        const tree = parser.parse(rubyCode);
        if (!tree || !tree.rootNode) return null;

        const extracted = {
            method: [],
            MethodDeclaration: [],
            ClassDeclaration: [],
            ModuleDeclaration: [],
            IfStatement: [],
            WhileStatement: [],
            UntilStatement: [],
            ForStatement: [],
            VariableAssignment: [],
            MethodCall: [],
        };

        extractAST(tree.rootNode, rubyCode, extracted);
        return { ast: tree, extracted };
    } catch (e) {
        return null;
    }
}

module.exports = { parseRubyUsingTreeSitter };
