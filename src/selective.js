
const vscode = require('vscode');
const UndoTreeProvider = require('./undotreeprovider.js');
const UndoTree = require('./undotree.js');
const { TreeNode } = require('./node.js');
const time = require('console')

const DFStraversing = (rootNode)=>{
    const allStates =[];
    const stack = [rootNode];
    console.time()

    while(stack.length>0){
        const currentNode = stack.pop();
        // console.log("current node " , currentNode)
        allStates.push(currentNode.lexResult);

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
        console.log(selectedText);
        const allStates = DFStraversing(rootNode);
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