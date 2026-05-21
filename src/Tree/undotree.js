const vscode = require('vscode');
const { randomUUID } = require('crypto');

class UndoTree {

    #root;
    #currentNode;
    #stateCounter = 1;
    #showDateTimecode = false;

    constructor(initialState, parsedData = null) {
        this.#root = {
            state: initialState,
            children: [],
            parent: null,
            hash: randomUUID(),
            count: 0,
            datetime: new Date(),
            parsed: parsedData
        };
        this.#currentNode = this.#root;
    }

    addState(newState, parsedData = null) {
        const newNode = {
            state: newState,
            children: [],
            parent: this.#currentNode,
            hash: randomUUID(),
            datetime: new Date(),
            count: this.#stateCounter,
            parsed: parsedData
        };
        this.#stateCounter++;
        this.#currentNode.children.push(newNode);
        const childCount = this.#currentNode.children.length;
        this.#currentNode = newNode;
        return childCount;
    }

    undo() {
        if (this.#currentNode.parent) {
            this.#currentNode = this.#currentNode.parent;
            this.restoreState();
        }
    }

    redo(childIndex) {
        if (this.#currentNode.children && this.#currentNode.children[childIndex]) {
            this.#currentNode = this.#currentNode.children[childIndex];
            this.restoreState();
        }
    }

    gotoNode(targetNode) {
        if (targetNode) {
            this.#currentNode = targetNode;
            this.restoreState();
        }
    }

    reset(newInitialState) {
        this.#root = {
            state: newInitialState,
            children: [],
            parent: null,
            hash: randomUUID(),
            datetime: new Date(),
            count: 0,
            parsed: null
        };
        this.#currentNode = this.#root;
        this.#stateCounter = 1;
    }

    toggleDateTimecode() {
        this.#showDateTimecode = !this.#showDateTimecode;
    }

    getShowDateTimecode() {
        return this.#showDateTimecode;
    }

    getCurrentNode() {
        return this.#currentNode;
    }

    getRoot() {
        return this.#root;
    }

    restoreState() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(
                editor.document.positionAt(0),
                editor.document.positionAt(editor.document.getText().length)
            );
            edit.replace(
                editor.document.uri,
                fullRange,
                this.#currentNode.state
            );
            vscode.workspace.applyEdit(edit).catch(err => {
                console.error("Failed to restore state:", err);
            });
        }
    }
}

module.exports = UndoTree;
