function getChildren(node) {
    if (!node || typeof node !== "object") return [];

    if (Array.isArray(node.children)) return node.children.filter(Boolean);

    const children = [];
    for (const key in node) {
        if (["span", "loc", "range", "parent", "tree", "leadingComments", "trailingComments", "extra", "ctxt"].includes(key)) continue;

        const value = node[key];
        if (Array.isArray(value)) {
            value.forEach((item) => {
                if (item && typeof item === "object" && item.type) children.push(item);
            });
        } else if (value && typeof value === "object" && value.type) {
            children.push(value);
        }
    }

    return children;
}

const frequencyCache = new WeakMap();

function mergeFrequency(target, source) {
    Object.keys(source).forEach((key) => {
        target[key] = (target[key] || 0) + source[key];
    });
    return target;
}

function getNodeFrequency(node) {
    if (!node || typeof node !== "object") return {};
    if (frequencyCache.has(node)) return frequencyCache.get(node);

    const frequencyMap = {};
    if (node.type) frequencyMap[node.type] = 1;

    getChildren(node).forEach((child) => mergeFrequency(frequencyMap, getNodeFrequency(child)));

    frequencyCache.set(node, frequencyMap);
    return frequencyMap;
}

function nodeFrequencySimilarity(node1, node2) {
    const freq1 = getNodeFrequency(node1);
    const freq2 = getNodeFrequency(node2);

    const allKeys = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);
    let dotProduct = 0,
        magnitude1 = 0,
        magnitude2 = 0;

    for (const key of allKeys) {
        const count1 = freq1[key] || 0;
        const count2 = freq2[key] || 0;

        dotProduct += count1 * count2;
        magnitude1 += count1 ** 2;
        magnitude2 += count2 ** 2;
    }

    if (magnitude1 === 0 || magnitude2 === 0) return 0; // Avoid division by zero
    return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2)); // Cosine similarity
}


module.exports = { nodeFrequencySimilarity }
