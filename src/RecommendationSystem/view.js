const vscode = require('vscode');


function getWebviewContent() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recommended Previous Versions</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #1e1e1e;
                    margin: 0;
                    padding: 20px;
                }
                h1 {
                    color: #ffffff;
                    text-align: center;
                    margin-bottom: 20px;
                }
                #statesContainer {
                    display: flex;
                    flex-direction: column;
                    margin-top: 20px;
                }
                .state-item {
                    background-color: #2f2f2f;
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 20px;
                    box-shadow:#333333 ;
                }
                .codediv {
                    background-color: #292929;
                    border: 1px solid #ccc;
                    padding: 20px;
                    border-radius: 10px;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    font-family: monospace;
                    overflow: auto;
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
                    background-color: #007acc;
                    color: white;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background-color 0.15s ease;
                }
                button:hover {
                    background-color: #005f99;
                }
                .copy-button {
                    background-color: #28a745;
                }
                .copy-button:hover {
                    background-color: #218838;
                }
                .notification {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: #28a745;
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
                .empty-message {
                    color: #bbb;
                    text-align: center;
                    margin-top: 40px;
                    font-size: 1.2em;
                }
                .loading-indicator {
                    color: #ffffff;
                    text-align: center;
                    margin-top: 40px;
                    font-size: 1.2em;
                }
            </style>
        </head>
        <body>
            <h1>Recommended Previous Versions</h1>
            <div id="loadingIndicator" class="loading-indicator">Loading recommendations...</div>
            <div id="statesContainer" style="display:none;"></div>
            <button onclick="closeWebview()">Close</button>
            <div class="notification" id="copyNotification">Copied to clipboard!</div>
            <script>
                const vscode = acquireVsCodeApi();
                function closeWebview() {
                    vscode.postMessage({ command: 'close' });
                }
                function displayStates(states) {
                    const container = document.getElementById('statesContainer');
                    const loading = document.getElementById('loadingIndicator');
                    loading.style.display = 'none';
                    container.style.display = '';
                    container.innerHTML = '';
                    if (!states || states.length === 0) {
                        const emptyMsg = document.createElement('div');
                        emptyMsg.className = 'empty-message';
                        emptyMsg.textContent = 'No similar previous versions found for the selected code.';
                        container.appendChild(emptyMsg);
                        return;
                    }
                    states.forEach(state => {
                        const stateDiv = document.createElement('div');
                        stateDiv.classList.add('state-item');
                        const pre = document.createElement('pre');
                        pre.classList.add('codediv');
                        pre.innerHTML = highlightCode(state);
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
                        stateDiv.appendChild(buttonContainer);
                        stateDiv.appendChild(pre);
                        container.appendChild(stateDiv);
                    });
                }
                function highlightCode(code) {
                    // Simple formatting: escape HTML and add color for keywords (basic, not language-specific)
                    let html = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    html = html.replace(/\b(function|const|let|var|if|else|for|while|return|class|def|public|private|protected|static|void|int|float|double|new|import|from|export|extends|implements|switch|case|break|continue|try|catch|finally|throw)\b/g, '<span style="color:#569CD6;font-weight:bold;">$1</span>');
                    return html;
                }
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'updateStates':
                            displayStates(message.data);
                            break;
                    }
                });
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

let panel = null; 

function createWebview(allStat, context) {
    if (panel) {
        // If the webview already exists, reveal and update it
        panel.reveal(vscode.ViewColumn.Two);
        panel.webview.html = getWebviewContent(); // Ensure the content updates
        panel.webview.postMessage({ command: 'updateStates', data: allStat });
        return;
    }

    // Create a new webview panel
    panel = vscode.window.createWebviewPanel(
        'allStatesView', // Identifier
        'All States', // Title
        vscode.ViewColumn.Two, // Show in the second column
        {
            enableScripts: true, // Enable JavaScript in the webview
            retainContextWhenHidden: true, // Keep the webview alive even when not visible
        }
    );

    // Set the HTML content of the webview
    panel.webview.html = getWebviewContent();

    // Wait for webview to load before sending data
    panel.webview.onDidReceiveMessage(
        async (message) => {
            switch (message.command) {
                case 'close':
                    panel.dispose(); // Close the webview
                    panel = null;
                    break;
                case 'replaceText':
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        // Bring the editor to the front before editing
                        await vscode.window.showTextDocument(editor.document, editor.viewColumn, false);
                        const selection = editor.selection;
                        editor.edit((editBuilder) => {
                            editBuilder.replace(selection, message.data);
                        });
                    }
                    break;
            }
        },
        undefined,
        context.subscriptions
    );

    // Ensure panel is properly disposed when closed
    panel.onDidDispose(() => {
        panel = null;
        console.log("Webview closed by user.");
    });

    // Ensure webview is ready before sending messages
    setTimeout(() => {
        if (panel) {
            panel.webview.postMessage({ command: 'updateStates', data: allStat });
        }
    }, 500); // Small delay to allow webview to load
}


module.exports = { createWebview }