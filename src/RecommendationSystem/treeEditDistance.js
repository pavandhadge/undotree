function getChildren(node) {
    if (!node || typeof node !== 'object') return [];

    if (Array.isArray(node.children)) return node.children.filter(Boolean);

    const children = [];
    for (const key in node) {
        if (['span', 'loc', 'range', 'parent', 'tree', 'leadingComments', 'trailingComments', 'extra', 'ctxt'].includes(key)) continue;
        if (Array.isArray(node[key])) {
            for (const item of node[key]) {
                if (item && typeof item === 'object' && item.type) {
                    children.push(item);
                }
            }
        } else if (node[key] && typeof node[key] === 'object' && node[key].type) {
            children.push(node[key]);
        }
    }
    return children;
}

function treeEditDistance(node1, node2) {
    const distanceCache = new WeakMap();
    const countCache = new WeakMap();

    function cachedCountNodes(node) {
        if (!node || typeof node !== 'object') return 0;
        if (countCache.has(node)) return countCache.get(node);

        const count = 1 + getChildren(node).reduce((total, child) => total + cachedCountNodes(child), 0);
        countCache.set(node, count);
        return count;
    }

    function getCachedDistance(n1, n2) {
        if (!n1 || !n2 || typeof n1 !== 'object' || typeof n2 !== 'object') return null;
        return distanceCache.get(n1)?.get(n2) ?? null;
    }

    function setCachedDistance(n1, n2, value) {
        if (!n1 || !n2 || typeof n1 !== 'object' || typeof n2 !== 'object') return;
        if (!distanceCache.has(n1)) distanceCache.set(n1, new WeakMap());
        distanceCache.get(n1).set(n2, value);
    }

    function ted(n1, n2) {
        if (!n1 && !n2) return 0;
        if (!n1) return 1 + getChildren(n2).length;
        if (!n2) return 1 + getChildren(n1).length;

        const cached = getCachedDistance(n1, n2);
        if (cached !== null) return cached;

        const cost = n1.type === n2.type ? 0 : 1;
        const children1 = getChildren(n1);
        const children2 = getChildren(n2);

        const dp = Array(children1.length + 1)
            .fill(null)
            .map(() => Array(children2.length + 1).fill(0));

        for (let i = 0; i <= children1.length; i++) dp[i][0] = i;
        for (let j = 0; j <= children2.length; j++) dp[0][j] = j;

        for (let i = 1; i <= children1.length; i++) {
            for (let j = 1; j <= children2.length; j++) {
                const costSub = ted(children1[i - 1], children2[j - 1]);
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + costSub
                );
            }
        }

        const distance = dp[children1.length][children2.length] + cost;
        setCachedDistance(n1, n2, distance);
        return distance;
    }

    const maxSize = Math.max(cachedCountNodes(node1), cachedCountNodes(node2), 1);
    const distance = ted(node1, node2);
    return Math.max(0, 1 - distance / maxSize);
}

module.exports = { treeEditDistance };
