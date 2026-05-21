# RewindCode

RewindCode is a VS Code extension that replaces strictly linear undo/redo workflows with a navigable undo tree. It stores editor states as branches, so you can move between different coding attempts without losing alternate paths.

It also includes code-aware previous-version recommendations: select a function, component, CSS rule, HTML element, or supported code block and RewindCode ranks matching snippets from your undo history.

## Features

- **Undo and Redo**: Navigate through editor states in a non-linear tree.
- **Save and Advance**: Save the current editor state as a new undo-tree node and move to it.
- **Reset Tree**: Clear the undo tree and start fresh.
- **Previous Versions**: Select code and get ranked previous versions from history. Suggestions can be copied or used to replace the current selection.
- **Smart Ranking**: Recommendations combine symbol/name matching, signature similarity, text similarity, AST shape, semantic features, size compatibility, and edit recency.
- **Memory-Aware Recommendations**: Results are capped by default, returned compactly, and lazily parsed history is not retained unless configured.
- **Timecode Toggle**: Optionally display timecodes associated with undo-tree states.

## Supported Languages

RewindCode currently has parser support for:

- **JavaScript (JS)**
- **TypeScript (TS)**
- **Python**
- **Java**
- **C++**
- **C**
- **C#**
- **Go / Golang**
- **Rust**
- **Swift**
- **Kotlin**
- **Ruby**
- **HTML**
- **CSS**
- **PHP**
- **Bash**

JavaScript and TypeScript use SWC. Other supported languages use Tree-sitter parsers.

## Commands

The following commands are available within the extension:

- `RewindCode: Show Previous Versions (alt+r)`: Select code and view ranked previous versions from undo history.
- `UndoTree: Undo (alt+z)`: Undo a change.
- `UndoTree: Redo (alt+y)`: Redo a previously undone change.
- `UndoTree: Save and Advance (alt+s)`: Save the current state and continue.
- `UndoTree: Reset Tree`: Reset the entire undo tree.
- `UndoTree: Toggle Showing Timecode`: Toggle the visibility of timecodes associated with each state.

## Keybindings

| Command                          | Keybinding |
|-----------------------------------|------------|
| Undo Tree: Undo                  | alt+z      |
| Undo Tree: Redo                  | alt+y      |
| Undo Tree: Save and Advance      | alt+s      |
| RewindCode: Previous Versions    | alt+r      |

## Reference Images
![Sidebar](./images/sidebar.png)
![Selective code operations](./images/selective.png)

## Installation

1. Install the extension from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/).
2. You can also clone the repository and run the following commands to set it up locally:

```bash
git clone https://github.com/pavandhadge/undotree.git
cd undotree
npm install
```

## Configuration

Create an `undotree.config.json` file in your project root to customize behavior:

```json
{
    "language": {
        "name": "javascript",
        "ismodule": true
    },
    "framework": {
        "name": "react"
    },
    "func-recommendation": {
        "active": true,
        "threshold": 0.7,
        "max-suggestions": 25,
        "cache-parsed-history": false
    }
}
```

### Configuration Fields

| Field | Description |
|-------|-------------|
| `language.name` | Parser language. Supported values include `javascript`, `typescript`, `python`, `java`, `cpp`, `c`, `csharp`, `golang`, `rust`, `swift`, `kotlin`, `ruby`, `php`, `html`, `css`, and `bash`. |
| `language.ismodule` | JavaScript/TypeScript module parsing mode. Defaults to `true` when omitted. |
| `framework.name` | Enables JSX/TSX parsing for supported frontend frameworks such as `react`, `next.js`, and `solid`. |
| `func-recommendation.active` | Enables parsed code history and previous-version recommendations. |
| `func-recommendation.threshold` | Minimum match score required for a recommendation. Defaults to `0.7`. |
| `func-recommendation.max-suggestions` | Maximum number of suggestions returned to the webview. Defaults to `25`. |
| `func-recommendation.cache-parsed-history` | When `true`, lazily parsed old undo states are stored on history nodes for speed. Defaults to `false` to reduce memory use. |

### Recommendation System

The recommendation system works locally and does not call an external service. When code is selected, RewindCode:

1. Parses the selected text.
2. Extracts candidate AST entries from the selection.
3. Walks the undo tree.
4. Compares historical snippets against the selected candidate.
5. Filters by `threshold`.
6. Deduplicates normalized code.
7. Sorts by match score and recency.
8. Returns compact `{ code, similarity }` suggestions to the webview.

Ranking uses:

- Symbol and name similarity.
- Function signature similarity.
- Token and line-level text similarity.
- Semantic features such as identifiers, literals, returns, and structure.
- AST tree edit distance.
- AST node-frequency cosine similarity.
- Size compatibility.
- Undo-tree recency.

Parser extraction also preserves useful names for JavaScript/TypeScript variable-assigned functions, HTML elements, and CSS selectors so recommendations can distinguish logically different snippets.

## Development

To develop and test this extension, ensure that you have Node.js and npm installed. You can use the following scripts:

```bash
npm run compile   # Compile the TypeScript source files.
npm run watch     # Watch for changes and recompile automatically.
npm run lint      # Lint the source code using ESLint.
npm run test      # Run the test suite.
```

## Repository

- **GitHub Repository:** [https://github.com/pavandhadge/undotree](https://github.com/pavandhadge/undotree)

## Maintainers

- **Pavan Dhadge and Team**
