const UndoTree = require('./undotree.js');
const vscode = require('vscode');

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

class UndoTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;

        this.undoTrees = new Map();

        this._disposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                this.cleanupClosedEditors(editor.document.uri.toString());
            }
        });
    }

    getTreeItem(element) {
        return element;
    }

    async getChildren(element) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return [];
        }

        const uri = editor.document.uri.toString();
        const undoTree = this.undoTrees.get(uri);

        if (!undoTree) {
            return [];
        }

        if (!element) {
            return this.getTreeItems(undoTree.getRoot());
        }

        return this.getTreeItems(element.node);
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
        } else if (difference < msPerHour) {
            const hours = Math.floor(difference / msPerHour);
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        } else {
            const days = Math.floor(difference / msPerDay);
            return `${days} day${days !== 1 ? 's' : ''}`;
        }
    }

    getTreeItems(node) {
        const undoTree = this.getUndoTreeForActiveEditor();
        if (!undoTree) return [];

        const currentNode = undoTree.getCurrentNode();
        const showTimecode = undoTree.getShowDateTimecode();

        return node.children.map(child => {
            const isCurrent = currentNode && child.hash === currentNode.hash;
            return new TreeNodeItem(
                `State ${child.count}${isCurrent ? ' *' : ''}${showTimecode ? `\t(${this.timeDifference(new Date(), child.datetime)} ago)` : ''}`,
                child
            );
        });
    }

    ensureUndoTreeForDocument(document) {
        const uri = document.uri.toString();
        if (!this.undoTrees.has(uri)) {
            const newUndoTree = new UndoTree(document.getText());
            this.undoTrees.set(uri, newUndoTree);
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

    cleanupClosedEditors(currentUri) {
        const openUris = new Set(
            vscode.window.visibleTextEditors.map(e => e.document.uri.toString())
        );
        for (const [uri] of this.undoTrees) {
            if (uri !== currentUri && !openUris.has(uri)) {
                this.undoTrees.delete(uri);
            }
        }
    }

    dispose() {
        this._disposable.dispose();
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }
}

module.exports = UndoTreeProvider;
