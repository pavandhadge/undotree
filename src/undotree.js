import {TreeNode} from './node.js'
import * as vscode from 'vscode'
import { hash, randomUUID } from 'crypto'




/**
 * Represents a tree node structure.
 * @typedef {Object} TreeNode
 * @property {string} state - The state of the node.
 * @property {TreeNode[]} children - Array of child nodes.
 * @property {TreeNode | null} parent - Parent node or null if it’s the root.
 * @property {string} hash - Unique identifier for the node.
 * @property {Date} datetime - Timestamp associated with the node.
 * @property {number} count - Count or quantity related to the node.
 */


class UndoTree{

    #root;
    #currentNode;
    #statecounter = 1;
    #showDateTimecode = false;

    constructor(initialState){
        this.#root={
            state : initialState,
            children:[],
            parent :null,
            hash : randomUUID(),
            count = 0,
            datetime:new Date(),

        };
        this.#currentNode = this.#root;
        console.log(this.#root.hash);
    }

    addState(newState){
        const newnode = new TreeNode();
        newnode = {
            state : newState,
            children:[],
            parent:this.#currentNode,
            hash:randomUUID(),
            datetime:new Date(),
            count :this.#statecounter,
        }
        this.#statecounter++;
        this.#currentNode.children.push(newnode);
        const childCount = this.#currentNode.children.length;
        this.#currentNode = newnode;
        return childCount;
    }

    undo(){
        // if (this.#currentNode.parent && this.#currentNode.parent.parent) {
        // this.#currentNode = this.#currentNode.parent;
        //     this.restoreState();
        // }
        if (this.#currentNode.parent) {
                this.#currentNode = this.#currentNode.parent;
                this.restoreState();
            }

    }
    redo(childIndex){
        if(this.#currentNode.children && this.#currentNode.children[childIndex]){

            this.#currentNode = this.#currentNode.children[childIndex];
            this.restoreState();
        }
    }

    gotonode(targetNode){
        if(targetNode){
            this.#currentNode = targetNode;
            this.restoreState();
        }
    }

    reset(newInitialState){
        this.#root={
            state:newInitialState,
            children:[],
            parent:null,
            hash:randomUUID(),
            datetime:new Date(),
            count = 0,
        }
        this.#currentNode = this.#root;
        // this.restoreState();
        this.#statecounter = 1;
    }
    toggleDateTimecode(val){
        this.#showDateTimecode = val;
    }
    getShowDateTimecode(){
        return this.#showDateTimecode;
    }
    getCurrentNode(){
        return this.#currentNode;
    }
    getRoot(){
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
                this.currentNode.state
            );
            vscode.workspace.applyEdit(edit);
        }
    }


};

export default UndoTree;