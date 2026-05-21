const { getParser, extractAST, convertToRecommendationFormat } = require("../parserUtils");
const GoLang = require("tree-sitter-go");

async function parseGoUsingTreeSitter(code) {
    try {
        const parser = getParser(GoLang);
        const tree = parser.parse(code);

        if (!tree || !tree.rootNode) return null;

        const extracted = {
            function_declaration: [],
            import_declaration: [],
            var_declaration: [],
            if_statement: [],
            for_statement: [],
            switch_statement: [],
            type_declaration: [],
            return_statement: [],
            expression_statement: [],
        };

        extractAST(tree.rootNode, code, extracted);

        return {
            ast: convertToRecommendationFormat(tree.rootNode),
            extracted,
        };
    } catch (e) {
        return null;
    }
}

module.exports = { parseGoUsingTreeSitter };
