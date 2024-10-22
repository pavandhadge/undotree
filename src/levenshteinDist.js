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

module.exports = {
    levenshteinDistance,
    isSimilar,
    relativeThreshold,
}