import TreeNode from "./node";
import UndoTree from "./undotree";
import * as vscode from 'vscode';


class TreeNodeItem extends vscode.TreeItem {
    constructor(label, node, collapsibleState = vscode.TreeItemCollapsibleState.Expanded) {
        super(label, collapsibleState);
        this.node = node;
        this.command = {
            command: 'undotree.gotoState',
            title: 'Go to State',
            arguments: [node]
        };
        this.contextValue = 'treeNodeItem';
    }
}

class UndoTreeProvider{
    constructor(){
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData;

        this. UndoTrees = new Map();
    }
    getTreeItem(element){
        return element
    }

    getChildren(element) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return Promise.resolve([]);
        }

        const uri = editor.document.uri.toString();
        const undoTree = this.undoTrees.get(uri);

        if (!undoTree) {
            return Promise.resolve([]);
        }

        if (!element) {
            return Promise.resolve(this.getTreeItems(undoTree.getRoot()));
        }
        return Promise.resolve(this.getTreeItems(element.node));
    }


    timeDifference(newDate, oldDate) {
        const msPerSecond = 1000;
        const msPerMinute = msPerSecond * 60;
        const msPerHour = msPerMinute * 60;
        const msPerDay = msPerHour * 24;

        const difference = newDate - oldDate;

        if (difference < msPerMinute) {
            const seconds = Math.floor(difference / msPerSecond);
            return `${seconds} second${seconds !== 1 ? 's' : ''}`;
        } else if (difference < msPerHour) {
            const minutes = Math.floor(difference / msPerMinute);
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else if (difference < msPerDay) {
            const hours = Math.floor(difference / msPerHour);
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        } else {
            const days = Math.floor(difference / msPerDay);
            return `${days} day${days !== 1 ? 's' : ''}`;
        }
    }

    getTreeItems(node) {
        return node.children.map(child => {
            const isCurrent = child.hash === (this.getUndoTreeForActiveEditor() || {}).getCurrentNode()?.hash;
            const showTimecode = this.getUndoTreeForActiveEditor()?.getShowTimecode();
            return new TreeNodeItem(
                `State ${child.count}${isCurrent ? ' *' : ''}${showTimecode ? `\t(${this.timeDifference(new Date().getTime(), child.datetime.getTime())} ago)` : ''}`,
                child
            );
        });
    }
    ensureUndoTreeForDocument(document) {
        const uri = document.uri.toString();
        if (!this.undoTrees.has(uri)) {
            const newUndoTree = new UndoTree(document.getText());
            this.undoTrees.set(uri, newUndoTree);
            newUndoTree.addState(document.getText());
        }
    }

    getUndoTreeForActiveEditor() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return undefined;
        }
        this.ensureUndoTreeForDocument(editor.document);
        return this.undoTrees.get(editor.document.uri.toString());
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }
}

export default {UndoTreeProvider,TreeNodeItem};
