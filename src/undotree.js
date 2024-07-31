const { TreeNode } = require('./node.js');
const vscode = require('vscode');
const { randomUUID } = require('crypto');

/**
 * Represents an undo tree structure.
 */
class UndoTree {

    #root;
    #currentNode;
    #stateCounter = 1;
    #showDateTimecode = false;

    /**
     * @param {string} initialState - The initial state of the root node.
     */
    constructor(initialState) {
        this.#root = {
            state: initialState,
            children: [],
            parent: null,
            hash: randomUUID(),
            count: 0,
            datetime: new Date(),
        };
        this.#currentNode = this.#root;
        console.log(this.#root.hash);
    }

    /**
     * Adds a new state to the tree.
     * @param {string} newState - The new state to be added.
     * @returns {number} - The number of children after the new state is added.
     */
    addState(newState) {
        const newNode = {
            state: newState,
            children: [],
            parent: this.#currentNode,
            hash: randomUUID(),
            datetime: new Date(),
            count: this.#stateCounter,
        };
        this.#stateCounter++;
        this.#currentNode.children.push(newNode);
        const childCount = this.#currentNode.children.length;
        this.#currentNode = newNode;
        return childCount;
    }

    /**
     * Moves to the parent node and restores its state.
     */
    undo() {
        if (this.#currentNode.parent) {
            this.#currentNode = this.#currentNode.parent;
            this.restoreState();
        }
    }

    /**
     * Moves to a specific child node and restores its state.
     * @param {number} childIndex - The index of the child node to move to.
     */
    redo(childIndex) {
        if (this.#currentNode.children && this.#currentNode.children[childIndex]) {
            this.#currentNode = this.#currentNode.children[childIndex];
            this.restoreState();
        }
    }

    /**
     * Moves to a specific node and restores its state.
     * @param {Object} targetNode - The target node to move to.
     */
    gotoNode(targetNode) {
        if (targetNode) {
            this.#currentNode = targetNode;
            this.restoreState();
        }
    }

    /**
     * Resets the tree with a new initial state.
     * @param {string} newInitialState - The new initial state.
     */
    reset(newInitialState) {
        this.#root = {
            state: newInitialState,
            children: [],
            parent: null,
            hash: randomUUID(),
            datetime: new Date(),
            count: 0,
        };
        this.#currentNode = this.#root;
        this.#stateCounter = 1;
    }

    /**
     * Toggles the display of the datetime code.
     * @param {boolean} val - True to show datetime code, false otherwise.
     */
    toggleDateTimecode(val) {
        this.#showDateTimecode = val;
    }

    /**
     * Gets the current state of the datetime code display.
     * @returns {boolean} - The current state of the datetime code display.
     */
    getShowDateTimecode() {
        return this.#showDateTimecode;
    }

    /**
     * Gets the current node.
     * @returns {Object} - The current node.
     */
    getCurrentNode() {
        return this.#currentNode;
    }

    /**
     * Gets the root node.
     * @returns {Object} - The root node.
     */
    getRoot() {
        return this.#root;
    }

    /**
     * Restores the state of the active text editor to match the current node's state.
     */
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
            vscode.workspace.applyEdit(edit);
        }
    }
}

module.exports = UndoTree;
