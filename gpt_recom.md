• # Recommendation System Improvement Plan

  ## Goal

  Make RewindCode recommendations feel like “show me the exact useful previous version of this code,” not just “show me structurally similar snippets.”

  The system should optimize for:

  - Same logical symbol across history.
  - Useful previous versions, not unrelated similar code.
  - Fast results on large undo trees.
  - Clear ranking reasons.
  - Fewer noisy suggestions.
  - Better support for multi-language projects.

  ## Current System

  The current recommendation system:

  - Parses the selected code.
  - Walks the undo tree.
  - Extracts historical AST snippets.
  - Scores each old snippet using:
    - Tree edit distance.
    - AST node frequency cosine similarity.
    - Name/token/return/structure semantic features.
  - Filters by threshold.
  - Sorts by similarity.
  - Shows results in a webview.

  This is a solid base, but it is still mostly local AST similarity. To make it excellent, the system needs identity tracking, stronger ranking, better retrieval, and user feedback.

  ## Biggest Improvements

  ### 1. Track Symbol Identity

  The most important improvement is to identify “this is the same function/class/component across time.”

  Add a stable symbol key:

  ```js
  {
    filePath,
    language,
    category,
    name,
    normalizedName,
    signature,
    parentScope,
    startLine,
    endLine
  }

  For functions, include:

  - Function name.
  - Parameters.
  - Return type.
  - Class/object owner.
  - Export status.
  - Component name for JSX/TSX.

  Ranking should heavily prefer same symbol identity over generic similarity.

  Example priority:

  1. Same file + same symbol name + similar signature.
  2. Same file + renamed but very similar body.
  3. Different file + same symbol name.
  4. Generic structural match.

  ### 2. Split Retrieval From Ranking

  Right now every candidate is scored directly during DFS. Instead:

  - Retrieval gets a smaller candidate set quickly.
  - Ranking deeply scores only those candidates.

  Retrieval can use cheap filters:

  - Same category: function vs class vs CSS rule vs HTML element.
  - Same or similar name.
  - Same file path.
  - Similar code token hash.
  - Similar AST node frequency.
  - Similar length.

  Then ranking can use heavier scoring.

  ### 3. Add Time-Aware Ranking

  A previous version from 30 seconds ago is usually more relevant than one from 2 hours ago.

  Add recency weight:

  finalScore =
    similarityScore * 0.75 +
    symbolIdentityScore * 0.15 +
    recencyScore * 0.10

  But do not let recency beat a clearly better semantic match.

  Recommended behavior:

  - Same symbol from recent history should rank first.
  - Older versions should still appear if they are much better matches.
  - Show “latest matching version” near the top.

  ### 4. Add Edit Distance On Code Text

  AST similarity is good, but users often want prior text versions.

  Add normalized text diff similarity:

  - Token-level Levenshtein.
  - Line-level diff similarity.
  - Identifier-aware diff.

  This helps distinguish:

  function add(a, b) { return a + b; }

  from:

  function add(a, b) {
    const total = a + b;
    return total;
  }

  These should score very high because they are likely versions of the same code.

  ### 5. Improve Name Matching

  Current name score is useful but basic.

  Improve it with:

  - camelCase splitting.
  - snake_case splitting.
  - kebab-case splitting.
  - abbreviation matching.
  - prefix/suffix similarity.
  - rename detection.

  Examples:

  - addTotal should match sumTotal.
  - getUserName should match fetchUserName.
  - UserCard should not match SettingsPanel.

  Name score should be one of the strongest ranking features.

  ### 6. Add Signature Similarity

  For functions/methods, compare signatures separately:

  - Parameter count.
  - Parameter names.
  - Parameter types.
  - Return type.
  - Async/generator status.
  - Visibility/modifiers where supported.

  A same-name function with totally different parameters should be penalized.

  ### 7. Add Scope Awareness

  The recommender should know where code lived.

  For example:

  class UserService {
    getUser() {}
  }

  is different from:

  class AdminService {
    getUser() {}
  }

  Add parent scope extraction:

  - Class name.
  - Object name.
  - Module/file.
  - CSS selector parent.
  - HTML ancestor path where useful.

  ### 8. Avoid Whole-File Noise Better

  The current isWholeFileMatch check helps, but the system should also avoid:

  - Returning import blocks when a function is selected.
  - Returning inner statements when outer function is selected.
  - Returning generated wrapper nodes.
  - Returning overly tiny snippets unless the selection is tiny.
  - Returning snippets with very different length.

  Add size gates:

  lengthRatio = oldLength / selectedLength

  Reject candidates where ratio is extreme, unless symbol identity is very strong.

  ### 9. Add Diversity And Deduplication

  Current dedupe is exact code text. Improve it with near-duplicate clustering.

  If five suggestions are tiny formatting changes, show the best one first and hide the rest behind “more versions.”

  Dedup keys:

  - Exact normalized code.
  - Same symbol + same body hash.
  - Same AST shape + same token set.

  ### 10. Add Explainable Scores

  For debugging and user trust, each suggestion should carry score parts:

  {
    code,
    similarity,
    reasons: {
      symbol: 0.95,
      name: 1.0,
      signature: 0.9,
      ast: 0.82,
      text: 0.88,
      recency: 0.7
    }
  }

  In the UI, optionally show:

  - “Same function name”
  - “Similar parameters”
  - “Previous version from 4 edits ago”
  - “87% match”

  This will make ranking easier to tune.

  ## Better Final Ranking Formula

  Use a category-specific ranker.

  For functions:

  score =
    symbolIdentity * 0.25 +
    nameSimilarity * 0.20 +
    signatureSimilarity * 0.15 +
    textSimilarity * 0.15 +
    semanticSimilarity * 0.10 +
    astSimilarity * 0.10 +
    recency * 0.05

  For CSS:

  score =
    selectorSimilarity * 0.35 +
    propertySimilarity * 0.25 +
    textSimilarity * 0.20 +
    astSimilarity * 0.10 +
    recency * 0.10

  For HTML/JSX:

  score =
    tagComponentSimilarity * 0.25 +
    attributeSimilarity * 0.20 +
    textSimilarity * 0.20 +
    structureSimilarity * 0.20 +
    recency * 0.15

  ## Indexing

  Build a recommendation index per undo tree instead of rescanning everything each time.

  Each node should cache:

  node.recommendationEntries = [
    {
      id,
      nodeHash,
      filePath,
      timestamp,
      code,
      ast,
      category,
      name,
      signature,
      parentScope,
      tokens,
      bodyHash,
      astTypeFrequency,
      lineCount,
      charCount
    }
  ]

  Benefits:

  - Faster recommendations.
  - Easier dedupe.
  - Easier debugging.
  - Cleaner scoring code.

  ## UI Improvements

  The webview should show better metadata:

  - Match percentage.
  - Symbol name.
  - Edit age: “3 edits ago.”
  - Buttons:
      - Replace selection.
      - Copy.
      - Compare with current selection.
      - Open source state in undo tree.

  Most important feature: add a diff preview before replace.

  ## Testing Improvements

  Add tests for:

  - Rename detection.
  - Same symbol across multiple undo nodes.
  - Large undo tree performance.
  - Near-duplicate suppression.
  - Recency ranking.
  - Same function name in different classes.
  - JSX component vs unrelated component.
  - CSS selector matching.
  - HTML tag/attribute matching.
  - Fallback behavior when parsing fails.

  ## Roadmap

  ### Phase 1

  - Add symbol metadata extraction.
  - Add text similarity.
  - Add signature similarity.
  - Add score breakdown object.
  - Improve dedupe.

  ### Phase 2

  - Add indexed recommendation entries.
  - Add recency scoring.
  - Add category-specific ranking formulas.
  - Add better tests.

  ### Phase 3

  - Add diff preview UI.
  - Add “why this matched” labels.
  - Add telemetry-free local feedback: thumbs up/down stored locally.
  - Use feedback to adjust ranking weights.

  ## Best Architecture

  Recommended folder shape:

  src/RecommendationSystem/
    recommendation.js
    indexer.js
    ranker.js
    features.js
    symbolIdentity.js
    textSimilarity.js
    astSimilarity.js
    dedupe.js
    explain.js
    view.js

  Keep recommendation.js as orchestration only.

  Ideal flow:

  selected code
    -> parse
    -> extract selected entry
    -> build selected features
    -> retrieve candidates from undo-tree index
    -> rank candidates
    -> dedupe and diversify
    -> return explainable suggestions
    -> show diff-capable UI

  ## The Core Idea

  The current system asks:

  “Which old AST looks similar to this selected AST?”

  The improved system should ask:

  “Which previous version of this exact logical code unit is most useful to restore, compare, or copy?”

  That shift is what will make the recommendation system feel excellent.