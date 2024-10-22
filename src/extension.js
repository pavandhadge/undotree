// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const UndoTreeProvider = require('./undotreeprovider.js');
const UndoTree = require('./undotree.js');
const selective = require('./selective.js')
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {

    // Create an instance of UndoTreeProvider
    console.log('UndoTreeProvider:', UndoTreeProvider);
    const treeDataProvider = new UndoTreeProvider();

    // Register a command to update the UndoTree when the active text editor changes
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            treeDataProvider.getUndoTreeForActiveEditor();
            treeDataProvider.refresh();
        }
    });



    // Register commands


    context.subscriptions.push(
        vscode.commands.registerCommand('undotree.undo', () => {
            const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
            if (!undoTree) return;
            const text_buff = vscode.window.activeTextEditor?.document.getText() || '';
            if (text_buff !== undoTree.getCurrentNode().state) {
                undoTree.addState(text_buff);
            }
            undoTree.undo();
            treeDataProvider.refresh();
        }),

        vscode.commands.registerCommand('undotree.redo', () => {
            const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
            if (!undoTree) return;
            undoTree.redo(0); // Assuming single child for simplicity, takes the first in history
            treeDataProvider.refresh();
        }),

        vscode.commands.registerCommand('undotree.saveAndAdvance', async () => {
            const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
            if (!undoTree) return;

            await vscode.workspace.saveAll();

            const text_buff = vscode.window.activeTextEditor?.document.getText() || '';
            if (text_buff !== undoTree.getCurrentNode().state) {
                const nodeCount = undoTree.addState(text_buff);
                undoTree.redo(nodeCount - 1);
                treeDataProvider.refresh();
            }
        }),

        vscode.commands.registerCommand('undotree.resetTree', () => {
            const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
            if (!undoTree) return;
            const newInitState = vscode.window.activeTextEditor?.document.getText() || '';
            undoTree.reset(newInitState);
            undoTree.addState(newInitState);
            treeDataProvider.refresh();
        }),

        vscode.commands.registerCommand('undotree.toggleTimecode', () => {
            const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
            if (!undoTree) return;
            undoTree.toggleTimecode();
            treeDataProvider.refresh();
        }),

        vscode.commands.registerCommand('undotree.gotoState', (node) => {
            const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
            if (!undoTree) return;
            undoTree.gotoNode(node);
            treeDataProvider.refresh();
        }),
        vscode.commands.registerCommand('undotree.selective', (node ) => {
            const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
            // console.log(undoTree);
            const root = undoTree.getRoot();
            if (!undoTree) return;
            console.log(typeof(selective))
            selective(node,root,context);
            // treeDataProvider.refresh();
        }),

        vscode.commands.registerCommand('undotree.refreshTree', () => {
            treeDataProvider.refresh();
        })
    );

    // Register the tree data provider
    vscode.window.registerTreeDataProvider('undoTreeView', treeDataProvider);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
};
