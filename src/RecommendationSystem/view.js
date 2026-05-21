const vscode = require('vscode');

function getWebviewContent(states) {
    const statesJson = JSON.stringify(states || []).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
            <title>Code Recommendations</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    margin: 0;
                    padding: 20px;
                }

                h1 {
                    color: var(--vscode-editor-foreground);
                    text-align: center;
                    margin-bottom: 20px;
                }
                #statesContainer {
                    display: flex;
                    flex-direction: column;
                    margin-top: 20px;
                }
                .state-item {
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                .codediv {
                    background-color: var(--vscode-textBlockQuote-background);
                    border: 1px solid var(--vscode-editor-lineHighlightBorder);
                    padding: 20px;
                    border-radius: 10px;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    font-family: var(--vscode-editor-font-family);
                    overflow: auto;
                    color: var(--vscode-editor-foreground);
                }
               .code-button {
                    display: flex;
                    align-items: flex-end;
                    justify-content: flex-end;
                    margin-top: 10px;
                }

                button {
                    margin-left: 10px;
                    margin-right: 10px;
                    padding: 8px 12px;
                    border: none;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background-color 0.15s ease;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .copy-button {
                    background-color: var(--vscode-terminal-ansiGreen);
                }
                .copy-button:hover {
                    opacity: 0.8;
                }
                .notification {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: var(--vscode-terminal-ansiGreen);
                    color: white;
                    padding: 12px;
                    border-radius: 8px;
                    display: none;
                    opacity: 0;
                    transition: opacity 0.15s ease-in-out;
                }
                .notification.show {
                    display: block;
                    opacity: 1;
                }
                .no-suggestions {
                    color: var(--vscode-descriptionForeground);
                    text-align: center;
                    padding: 40px;
                    font-size: 16px;
                }
                .version-label {
                    color: var(--vscode-descriptionForeground);
                    font-size: 12px;
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <h1>Previous Versions</h1>
            <div id="statesContainer"></div>
            <button onclick="closeWebview()">Close</button>

            <div class="notification" id="copyNotification">Copied to clipboard!</div>

            <script>
                const vscode = acquireVsCodeApi();
                const states = ${statesJson};

                function closeWebview() {
                    vscode.postMessage({ command: 'close' });
                }

                function displayStates(states) {
                    const container = document.getElementById('statesContainer');
                    container.innerHTML = '';

                    if (!states || states.length === 0) {
                        container.innerHTML = '<div class="no-suggestions">No previous versions found for this selection.</div>';
                        return;
                    }

                    states.forEach((state, index) => {
                        const stateDiv = document.createElement('div');
                        stateDiv.classList.add('state-item');

                        const label = document.createElement('div');
                        label.classList.add('version-label');
                        label.textContent = 'Version ' + (index + 1) + ' of ' + states.length;

                        const pre = document.createElement('pre');
                        pre.classList.add('codediv');
                        pre.textContent = state;

                        const buttonContainer = document.createElement('div');
                        buttonContainer.classList.add('code-button');

                        const replaceButton = document.createElement('button');
                        replaceButton.textContent = 'Replace';
                        replaceButton.onclick = () => {
                            vscode.postMessage({ command: 'replaceText', data: state });
                        };

                        const copyButton = document.createElement('button');
                        copyButton.textContent = 'Copy';
                        copyButton.classList.add('copy-button');
                        copyButton.onclick = () => {
                            copyToClipboard(state);
                        };

                        buttonContainer.appendChild(replaceButton);
                        buttonContainer.appendChild(copyButton);

                        stateDiv.appendChild(label);
                        stateDiv.appendChild(pre);
                        stateDiv.appendChild(buttonContainer);

                        container.appendChild(stateDiv);
                    });
                }

                displayStates(states);

                function copyToClipboard(text) {
                    navigator.clipboard.writeText(text).then(() => {
                        showNotification();
                    });
                }

                function showNotification() {
                    const notification = document.getElementById('copyNotification');
                    notification.classList.add('show');
                    setTimeout(() => {
                        notification.classList.remove('show');
                    }, 2000);
                }
            </script>
        </body>
        </html>
    `;
}

const panels = new Map();

function createWebview(allStat, context) {
    const editor = vscode.window.activeTextEditor;
    const editorUri = editor?.document.uri.toString() || 'default';

    if (panels.has(editorUri)) {
        const panel = panels.get(editorUri);
        panel.reveal(vscode.ViewColumn.Two);
        panel.webview.html = getWebviewContent(allStat);
        return;
    }

    const panel = vscode.window.createWebviewPanel(
        'allStatesView',
        'Previous Versions',
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );

    panels.set(editorUri, panel);

    panel.webview.html = getWebviewContent(allStat);

    panel.webview.onDidReceiveMessage(
        (message) => {
            switch (message.command) {
                case 'close':
                    panel.dispose();
                    break;
                case 'replaceText':
                    const currentEditor = vscode.window.activeTextEditor;
                    if (currentEditor && message.data && typeof message.data === 'string') {
                        const selection = currentEditor.selection;
                        currentEditor.edit((editBuilder) => {
                            editBuilder.replace(selection, message.data);
                        }).then(success => {
                            if (!success) {
                                vscode.window.showErrorMessage("Failed to replace text");
                            }
                        }).catch(err => {
                            vscode.window.showErrorMessage("Error replacing text: " + err.message);
                        });
                    }
                    break;
            }
        },
        undefined,
        context.subscriptions
    );

    panel.onDidDispose(() => {
        panels.delete(editorUri);
    });
}

module.exports = { createWebview };
