const vscode = require("vscode");
const UndoTreeProvider = require("./Tree/undotreeprovider.js");
const UndoTree = require("./Tree/undotree.js");
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
        if (!config) {
          vscode.window.showInformationMessage("No config file loaded. Using default config");
          // console.log("Using latest config:", config);
          console.log("Using latest config:", config);
        }
      } else {
        console.log("There was an error while getting the config");
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
      vscode.window.showInformationMessage("Config: " + JSON.stringify(config));
    })
  );

  // Register commands

  context.subscriptions.push(
    vscode.commands.registerCommand("undotree.undo", () => {
      const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
      if (!undoTree) return;
      const text_buff = vscode.window.activeTextEditor?.document.getText() || "";
      if (text_buff !== undoTree.getCurrentNode().state) {
        undoTree.addState(text_buff);
      }
      undoTree.undo();
      treeDataProvider.refresh();
    }),

    vscode.commands.registerCommand("undotree.redo", () => {
      const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
      if (!undoTree) return;
      undoTree.redo(0); // Assuming single child for simplicity, takes the first in history
      treeDataProvider.refresh();
    }),

    vscode.commands.registerCommand("undotree.saveAndAdvance", async () => {
      const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
      if (!undoTree) return;

      await vscode.workspace.saveAll();

      const text_buff = vscode.window.activeTextEditor?.document.getText() || "";
      if (text_buff !== undoTree.getCurrentNode().state) {
        let parsedData = null;
        const config = getConfig();
        console.log(
          "this is config : ",
          config,
          config?.["func-recommendation"],
          config?.["func-recommendation"]?.active
        );
        if (config?.["func-recommendation"]?.active == true) {
          parsedData = await parseCode(config?.["language"], config?.["framework"], text_buff);
          const nodeCount = undoTree.addState(text_buff, parsedData);
          undoTree.redo(nodeCount - 1);
          treeDataProvider.refresh();
        } else {
          const nodeCount = undoTree.addState(text_buff, parsedData);
          undoTree.redo(nodeCount - 1);
          treeDataProvider.refresh();
        }
        // const parsedData = await parseCode(language, framework, text_buff)
      }
    }),
    vscode.commands.registerCommand("rewindcode.recommendations", async (node) => {
      try {
        const config = getConfig();
        if (config?.["func-recommendation"]?.active != true) {
          vscode.window.showInformationMessage("Prev. version recommendation is turned off");
          return;
        }
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showInformationMessage("No active editor!");
          return;
        }
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        if (!selectedText || selectedText.trim() === "") {
          vscode.window.showInformationMessage("Please select some code to get recommendations.");
          return;
        }
        const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
        if (!undoTree) {
          vscode.window.showInformationMessage("No undo tree found for this file.");
          return;
        }
        const root = undoTree.getRoot();
        let parsedData = null;
        try {
          if (config?.["func-recommendation"]?.active == true) {
            parsedData = await parseCode(config?.["language"], config?.["framework"], selectedText);
          }
        } catch (parseErr) {
          vscode.window.showErrorMessage("Could not parse the selected code: " + parseErr.message);
          return;
        }
        if (!parsedData || !parsedData.ast || !parsedData.ast.body || parsedData.ast.body.length === 0) {
          vscode.window.showInformationMessage("No valid code structure found in selection.");
          return;
        }
        let suggestions = [];
        try {
          suggestions = recommendation(root, parsedData);
        } catch (recErr) {
          vscode.window.showErrorMessage("Error while generating recommendations: " + recErr.message);
          return;
        }
        if (!suggestions || suggestions.length === 0) {
          vscode.window.showInformationMessage("No similar previous versions found for the selected code.");
          return;
        }
        createWebview(suggestions, context);
        treeDataProvider.refresh();
      } catch (err) {
        vscode.window.showErrorMessage("Unexpected error in recommendations: " + (err && err.message ? err.message : err));
      }
    }),

    vscode.commands.registerCommand("undotree.resetTree", () => {
      const undoTree = treeDataProvider.getUndoTreeForActiveEditor();
      if (!undoTree) return;
      const newInitState = vscode.window.activeTextEditor?.document.getText() || "";
      undoTree.reset(newInitState);
      undoTree.addState(newInitState);
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
