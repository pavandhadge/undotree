const { getParser, extractAST } = require("../parserUtils");
const PythonLang = require("tree-sitter-python");

async function parsePythonUsingTreeSitter(code) {
    try {
        const parser = getParser(PythonLang);
        const tree = parser.parse(code);

        if (!tree || !tree.rootNode) return null;

        const extracted = {
            function_definition: [],
            import_statement: [],
            assignment: [],
            if_statement: [],
            for_statement: [],
            while_statement: [],
            try_statement: [],
            class_definition: [],
            return_statement: [],
            expression_statement: [],
        };

        extractAST(tree.rootNode, code, extracted);

        return { ast: tree, extracted };
    } catch (e) {
        return null;
    }
}

module.exports = { parsePythonUsingTreeSitter };
