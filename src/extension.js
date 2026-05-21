const vscode = require("vscode");
const UndoTreeProvider = require("./Tree/undotreeprovider.js");
const { trackEditorChanges } = require("./Config/configManager.js");
const { parseCode } = require("./parse.js");
const { getConfig } = require("./Config/configStore.js");
const { recommendation } = require("./RecommendationSystem/recommendation.js");
const { createWebview } = require("./RecommendationSystem/view.js");

function activate(context) {
  const treeDataProvider = new UndoTreeProvider();

  vscode.window.onDidChangeActiveTextEditor(async (editor) => {
    if (editor) {
      const result = await trackEditorChanges(editor);

      if (result === 1) {
        const config = getConfig();
        if (!config || Object.keys(config).length === 0) {
          vscode.window.showInformationMessage("No config file loaded. Using default settings");
        }
      }

      treeDataProvider.getUndoTreeForActiveEditor();
      treeDataProvider.refresh();
    }
  });

  if (vscode.window.activeTextEditor) {
    trackEditorChanges(vscode.window.activeTextEditor);
  }

  // Command to check config
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.showConfig", () => {
      const config = getConfig();
      vscode.window.showInformationMessage("Config: " + JSON.stringify(config));
    })
  );

  // Register commands

  context.subscriptions.push(
    vscode.commands.registerCommand("undotree.undo", async () => {
      const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
      if (!undoTree) return;
      const currentNode = undoTree.getCurrentNode();
      if (!currentNode) return;
      const text_buff = vscode.window.activeTextEditor?.document.getText() || "";
      if (text_buff !== currentNode.state) {
        let parsedData = null;
        const config = getConfig();
        if (config?.["func-recommendation"]?.active === true) {
          try {
            parsedData = await parseCode(config?.["language"], config?.["framework"], text_buff);
          } catch (err) {
            // Parsing failed, save without parsed data
          }
        }
        undoTree.addState(text_buff, parsedData);
      }
      undoTree.undo();
      treeDataProvider.refresh();
    }),

    vscode.commands.registerCommand("undotree.redo", () => {
      const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
      if (!undoTree) return;
      undoTree.redo(0);
      treeDataProvider.refresh();
    }),

    vscode.commands.registerCommand("undotree.saveAndAdvance", async () => {
      const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
      if (!undoTree) return;

      await vscode.workspace.saveAll();

      const currentNode = undoTree.getCurrentNode();
      if (!currentNode) return;

      const text_buff = vscode.window.activeTextEditor?.document.getText() || "";
      if (text_buff !== currentNode.state) {
        let parsedData = null;
        const config = getConfig();
        if (config?.["func-recommendation"]?.active === true) {
          try {
            parsedData = await parseCode(config?.["language"], config?.["framework"], text_buff);
          } catch (err) {
            // Parsing failed, continue without parsed data
          }
        }
        const nodeCount = undoTree.addState(text_buff, parsedData);
        undoTree.redo(nodeCount - 1);
        treeDataProvider.refresh();
      }
    }),
    vscode.commands.registerCommand("rewindcode.recommendations", async () => {
      const config = getConfig();
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("No active editor!");
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText || selectedText.trim().length === 0) {
        vscode.window.showInformationMessage("No text selected! Select a function or code block first.");
        return;
      }

      const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
      if (!undoTree) return;

      const root = undoTree.getRoot();
      let parsedData = null;

      if (config?.["func-recommendation"]?.active === true) {
        try {
          parsedData = await parseCode(config?.["language"], config?.["framework"], selectedText);
        } catch (err) {
          // Parsing failed, continue without parsed data
        }
      }

      const suggestions = await recommendation(root, parsedData, selectedText);
      createWebview(suggestions, context);
      treeDataProvider.refresh();
    }),

    vscode.commands.registerCommand("undotree.resetTree", () => {
      const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
      if (!undoTree) return;
      const newInitState = vscode.window.activeTextEditor?.document.getText() || "";
      undoTree.reset(newInitState);
      treeDataProvider.refresh();
    }),

    vscode.commands.registerCommand("undotree.toggleTimecode", () => {
      const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
      if (!undoTree) return;
      undoTree.toggleTimecode();
      treeDataProvider.refresh();
    }),

    vscode.commands.registerCommand("undotree.gotoState", (node) => {
      const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
      if (!undoTree) return;
      undoTree.gotoNode(node);
      treeDataProvider.refresh();
    }),

    vscode.commands.registerCommand("undotree.refreshTree", () => {
      treeDataProvider.refresh();
    })
  );

  // Register the tree data provider
  vscode.window.registerTreeDataProvider("undoTreeView", treeDataProvider);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
