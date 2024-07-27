// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	

    vscode.window.onDidChangeActiveTextEditor((editor) => {
        // initialize initial text editor as a node on load
        treeDataProvider.getUndoTreeForActiveEditor();
        treeDataProvider.refresh();
    });

    vscode.commands.registerCommand('undotree.undo', () => {
        const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
        if (!undoTree) return;
        const text_buff = vscode.window.activeTextEditor?.document.getText() || '';
        // if no change, don't do anything
        if (text_buff !== undoTree.getCurrentNode().state) {
            undoTree.addState(text_buff);
        }
        undoTree.undo();
        treeDataProvider.refresh();
    });

    vscode.commands.registerCommand('undotree.redo', () => {
        const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
        if (!undoTree) return;
        undoTree.redo(0); // Assuming single child for simplicity, takes the first in history
        treeDataProvider.refresh();
    });

    vscode.commands.registerCommand('undotree.saveAndAdvance', () => {
        const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
        if (!undoTree) return;
        const text_buff = vscode.window.activeTextEditor?.document.getText() || '';
        // if no change, don't do anything
        if (text_buff !== undoTree.getCurrentNode().state) {
            const nodeCount = undoTree.addState(text_buff);
            undoTree.redo(nodeCount - 1);
            treeDataProvider.refresh();
        }
    });

    vscode.commands.registerCommand('undotree.resetTree', () => {
        const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
        if (!undoTree) return;
        const newInitState = vscode.window.activeTextEditor?.document.getText() || '';
        undoTree.reset(newInitState);
        undoTree.addState(newInitState);

        treeDataProvider.refresh();
    });

    vscode.commands.registerCommand('undotree.toggleTimecode', () => {
        const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
        if (!undoTree) return;
        undoTree.toggleTimecode();
        treeDataProvider.refresh();
    });


    vscode.commands.registerCommand('undotree.gotoState', (node) => {
        const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
        if (!undoTree) return;
        undoTree.gotoNode(node);
        treeDataProvider.refresh();
    });

    vscode.commands.registerCommand('undotree.refreshTree', () => {
        treeDataProvider.refresh();
    });

    // finish instantiation
    treeDataProvider = new UndoTreeProvider();
    vscode.window.registerTreeDataProvider('undoTreeView', treeDataProvider);

	// context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
