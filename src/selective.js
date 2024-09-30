const vscode = require('vscode');
const UndoTreeProvider = require('./undotreeprovider.js');
const UndoTree = require('./undotree.js');
const { TreeNode } = require('./node.js');
const time = require('console')
const {parseJavaScript} = require('./testingparsing.js')
const {    levenshteinDistance,isSimilar,relativeThreshold} = require('./levenshteinDist.js')


function searchContent(content, query) {
    const options = {
        includeScore: true,
        keys: ['content'] // We are searching in the 'content' field
    };

    const fuse = new Fuse(contentArray, options);
    return fuse.search(query);
}

const DFStraversing = (rootNode,lexSelected,method)=>{
    const allStates =[];
    const stack = [rootNode];
    console.time()

    while (stack.length > 0) {
        const currentNode = stack.pop();

        currentNode.lexResult.functions.forEach(element => {
            lexSelected.functions.forEach(ele => {
                if (method === "levenshtein") {
                    if (relativeThreshold(element.normalisedBody, ele.normalisedBody, 50)) {
                        allStates.push(element.code);
                    }
                } else {
                    const fuse = searchContent(element.normalisedBody, ele.normalisedBody);
                    if (fuse.score >= 0.7) {
                        allStates.push(element.code);
                    }
                }
            });
        });

        currentNode.lexResult.classes.forEach(element => {
            lexSelected.classes.forEach(ele => {
                if (method === "levenshtein") {
                    if (relativeThreshold(element.normalisedBody, ele.normalisedBody, 50)) {
                        allStates.push(element.code);
                    }
                } else {
                    const fuse = searchContent(element.normalisedBody, ele.normalisedBody);
                    if (fuse.score >= 0.7) {
                        allStates.push(element.code);
                    }
                }
            });
        });

        currentNode.lexResult.ifElseStatements.forEach(element => {
            lexSelected.ifElseStatements.forEach(ele => {
                if (method === "levenshtein") {
                    if (relativeThreshold(element.normalisedBody, ele.normalisedBody, 50)) {
                        allStates.push(element.code);
                    }
                } else {
                    const fuse = searchContent(element.normalisedBody, ele.normalisedBody);
                    if (fuse.score >= 0.7) {
                        allStates.push(element.code);
                    }
                }
            });
        });

        currentNode.lexResult.forLoops.forEach(element => {
            lexSelected.forLoops.forEach(ele => {
                if (method === "levenshtein") {
                    if (relativeThreshold(element.normalisedBody, ele.normalisedBody, 50)) {
                        allStates.push(element.code);
                    }
                } else {
                    const fuse = searchContent(element.normalisedBody, ele.normalisedBody);
                    if (fuse.score >= 0.7) {
                        allStates.push(element.code);
                    }
                }
            });
        });

        currentNode.lexResult.switchStatements.forEach(element => {
            lexSelected.switchStatements.forEach(ele => {
                if (method === "levenshtein") {
                    if (relativeThreshold(element.normalisedBody, ele.normalisedBody, 50)) {
                        allStates.push(element.code);
                    }
                } else {
                    const fuse = searchContent(element.normalisedBody, ele.normalisedBody);
                    if (fuse.score >= 0.7) {
                        allStates.push(element.code);
                    }
                }
            });
        });

        // Push children to the stack
        for (const child of currentNode.children) {
            stack.push(child);
        }
    }

    // vscode.showInformationMessage("done traversing")
    console.timeEnd()
    return allStates;
}

const selective = (node,rootNode)=>{
    const editor = vscode.window.activeTextEditor;
    if(editor){
        const selection = editor.selection;

        const selectedText = editor.document.getText(selection);
        // console.log("selected text is ",selectedText);
        const lexSelected = parseJavaScript(selectedText);
        console.log("\nlexed selected code : ", lexSelected);
        //levenshtein fuzzy these are two options
        const allStates = DFStraversing(rootNode,lexSelected,"fuzzy");
        console.log("\n\nthese are all states : ",allStates);
        // console.log("length = ",allStates.length)

            
    }else{
        vscode.showInformationMessage("NO avtive editor !!");
        return;
    }
    // return;
    allStates.length=0;
}
module.exports=selective;