
const vscode = require('vscode');
const UndoTreeProvider = require('./undotreeprovider.js');
const UndoTree = require('./undotree.js');
const { TreeNode } = require('./node.js');
const time = require('console')
const {parseJavaScript} = require('./testingparsing.js')
const {    levenshteinDistance,isSimilar,relativeThreshold} = require('./levenshteinDist.js')
// const DFStraversing = (rootNode)=>{
//     const allStates =[];
//     const stack = [rootNode];
//     console.time()

//     while(stack.length>0){
//         const currentNode = stack.pop();
//         // console.log("current node " , currentNode)
//         allStates.push(currentNode.lexResult);

//         for(const child of currentNode.children){
//             stack.push(child);
//         }
//     }
//     // vscode.showInformationMessage("done traversing")
//     console.timeEnd()
//     return allStates;
// }


const DFStraversing = (rootNode,lexSelected)=>{
    const allStates =[];
    const stack = [rootNode];
    console.time()

    while(stack.length>0){
        const currentNode = stack.pop();
        // console.log("current node " , currentNode)
        currentNode.lexResult.functions.forEach(element => {
            console.log("given curr node : ",currentNode.lexResult.functions)
            // if(element.name === lexSelected.functions[0].name){
            //     console.log("same name of functions spoted")
            // }
            console.log("checking passed elements : " , element.normalisedBody )
            console.log("checking parameter 2 beofer executojn : ",lexSelected.functions[0].normalisedBody)
                if(relativeThreshold(element.normalisedBody,lexSelected.functions[0].normalisedBody,50)){

                allStates.push(element.code);
            }
        });


        for(const child of currentNode.children){
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
        // console.log(selection);
        const selectedText = editor.document.getText(selection);
        console.log("selected text is ",selectedText);
        const lexSelected = parseJavaScript(selectedText);
        console.log("\nlexed selected code : ",lexSelected);
        const allStates = DFStraversing(rootNode,lexSelected);
        console.log("these are all states : ",allStates);
        console.log("length = ",allStates.length)

        
    }else{
        vscode.showInformationMessage("NO avtive editor !!");
        return;
    }
    // return;
    allStates.length=0;
}
module.exports=selective;