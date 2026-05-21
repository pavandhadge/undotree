const { getParser, extractAST } = require("../parserUtils");
const BashLang = require("tree-sitter-bash");

async function parseBashUsingTreeSitter(bashScript) {
    try {
        const parser = getParser(BashLang);
        const tree = parser.parse(bashScript);
        if (!tree || !tree.rootNode) return null;

        const extracted = {
            Command: [],
            FunctionDefinition: [],
            IfStatement: [],
            WhileStatement: [],
            ForStatement: [],
            UntilStatement: [],
            Pipeline: [],
            Redirection: [],
            VariableAssignment: [],
        };

        extractAST(tree.rootNode, bashScript, extracted);
        return { ast: tree, extracted };
    } catch (e) {
        return null;
    }
}

module.exports = { parseBashUsingTreeSitter };
