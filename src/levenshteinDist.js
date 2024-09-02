  function levenshteinDistance(s1, s2) {
    const m = s1.length;
    const n = s2.length;

    // Create a 2D array to store distances
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    // Initialize the matrix
    for (let i = 0; i <= m; i++) {
        dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
        dp[0][j] = j;
    }

    // Compute the Levenshtein distance
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,      // Deletion
                dp[i][j - 1] + 1,      // Insertion
                dp[i - 1][j - 1] + cost // Substitution
            );
        }
    }
    return dp[m][n];
}
function isSimilar(s1, s2, maxDistance) {
    const distance = levenshteinDistance(s1, s2);
    return distance <= maxDistance;
}

function relativeThreshold(s1, s2, percentage) {
    const maxLength = Math.max(s1.length, s2.length);
    const maxDistance = Math.floor(maxLength * (percentage / 100));
    console.log(maxDistance)
    return isSimilar(s1, s2, maxDistance);
}



// Example usage:
const s1 = `    ClassExpression(node) {
      // console.log("what a node contains : ",node)
      const classBody = code.substring(node.body.start, node.body.end);
      const normalisedBody = normalizeCode(classBody);
      classes.push({ name: node.id ? node.id.name : node.type, code: classBody , normalisedBody : normalisedBody });
    }`;
const s2 = `    ClassDeclaration(node) {

      // console.log("what a node contains : ",node)
      const classBody = code.substring(node.body.start, node.body.end);
      const normalisedBody = normalizeCode(classBody);
      classes.push({ name: node.id ? node.id.name : node.type, code: classBody ,normalisedBody : normalisedBody });
    }`;

// const fixedThreshold = 3; // Fixed threshold

const percentage = 45;  

console.log(`Levenshtein distance between '${s1}' and '${s2}' is ${levenshteinDistance(s1, s2)}`);

console.log(`Using relative threshold: ${relativeThreshold(s1, s2, percentage) ? 'Similar' : 'Not Similar'}`);

module.exports = {
    levenshteinDistance,
    isSimilar,
    relativeThreshold,
}