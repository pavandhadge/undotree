class TreeNode {
    /**
     * @param {string} state - The state of the node (string)
     * @param {string} hash - Unique identifier (string)
     * @param {Date} datetime - Timestamp (Date object)
     * @param {number} count - Count or quantity (number)
     * @param {TreeNode|null} [parent=null] - Parent TreeNode or null
     */
    constructor(state, hash, datetime, count, parent = null) {
        this.state = state;            // The state of the node (string)
        this.children = [];           // Array of child TreeNodes
        this.parent = parent;         // Parent TreeNode or null
        this.hash = hash;             // Unique identifier (string)
        this.datetime = datetime;     // Timestamp (Date object)
        this.count = count;           // Count or quantity (number)
    }

    /**
     * Adds a child node to the current node.
     * @param {TreeNode} childNode - The child node to add
     * @throws {Error} If the provided childNode is not an instance of TreeNode
     */
    addChild(childNode) {
        if (childNode instanceof TreeNode) {
            childNode.parent = this;
            this.children.push(childNode);
        } else {
            throw new Error('Invalid child node');
        }
    }
}

module.exports = TreeNode;
