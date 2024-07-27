class TreeNode {
    constructor(state, hash, datetime, count, parent = null) {
        this.state = state;            // The state of the node (string)
        this.children = [];           // Array of child TreeNodes
        this.parent = parent;         // Parent TreeNode or null
        this.hash = hash;             // Unique identifier (string)
        this.datetime = datetime;     // Timestamp (Date object)
        this.count = count;           // Count or quantity (number)
    }

    // Optionally, you can add methods to this class
    addChild(childNode) {
        if (childNode instanceof TreeNode) {
            childNode.parent = this;
            this.children.push(childNode);
        } else {
            throw new Error('Invalid child node');
        }
    }
}

export default TreeNode;