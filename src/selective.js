const vscode = require('vscode');
const UndoTreeProvider = require('./undotreeprovider.js');
const UndoTree = require('./undotree.js');
const { TreeNode } = require('./node.js');
const time = require('console')
const { parseJavaScript } = require('./testingparsing.js')
const { levenshteinDistance, isSimilar, relativeThreshold } = require('./levenshteinDist.js')
const Fuse = require('fuse.js')
const allStates = [];

let panel; // Declare panel globally

function getWebviewContent() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>All States</title>
            <style>
                body { font-family: Arial, sans-serif; }
                pre { white-space: pre-wrap; word-wrap: break-word; }
                .codediv{
                    border : 1px green solid;
                    }
            </style>
        </head>
        <body>
            <h1>All States</h1>
            <div id="statesContainer"></div>
            <button onclick="closeWebview()">Close</button>

            <script>
                const vscode = acquireVsCodeApi();
                
                function closeWebview() {
                    vscode.postMessage({ command: 'close' });
                }

                // Function to display states
                function displayStates(states) {
                    const container = document.getElementById('statesContainer');
                    container.innerHTML = ''; // Clear previous states
                    states.forEach(state => {
                        const pre = document.createElement('pre');
                        pre.classList.add('codediv');
                        pre.textContent = state; // Display each state in a <pre> tag

                        // Create a button for each <pre>
                        const button = document.createElement('button');
                        button.textContent = 'Replace';
                        button.onclick = () => {
                            // When the button is clicked, send the state to the extension
                            vscode.postMessage({ command: 'replaceText', data: state });
                        };

                        // Append the <pre> and button to the container
                        container.appendChild(pre);
                        container.appendChild(button);
                    });
                }

                // Listen for messages from the extension
                window.addEventListener('message', event => {
                    const message = event.data; // The JSON message
                    switch (message.command) {
                        case 'updateStates':
                            // console.log(data);
                            alert("hello");
                            displayStates(message.data); // Update the displayed states
                            break;
                    }
                });
            </script>
        </body>
        </html>
    `;
}

function createWebview(allStat, context) {
    if (panel) {
        // If the webview already exists and is not disposed, reveal it
        if (panel.viewType === 'allStatesView') {
            panel.reveal(vscode.ViewColumn.One);
            return; // Exit early since the webview is already active
        } else {
            // If the existing panel has been disposed, create a new one
            panel = undefined;
        }
    }

    // Create a new webview panel
    panel = vscode.window.createWebviewPanel(
        'allStatesView', // Identifier
        'All States', // Title
        vscode.ViewColumn.Beside, // Show in the first half of the screen
        {
            enableScripts: true // Enable JavaScript in the webview
        }
    );

    // Set the HTML content of the webview
    panel.webview.html = getWebviewContent();

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'close':
                    panel.dispose(); // Close the webview if needed
                    panel = undefined; // Set to undefined after disposal
                    break;
                case 'replaceText':
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        const selection = editor.selection;
                        editor.edit(editBuilder => {
                            editBuilder.replace(selection, message.data); // Replace selected text
                        });
                    }
                    break;
            }
        },
        undefined,
        context.subscriptions
    );

    // Send the allStates data to the webview
    if (panel) {
        console.log(allStat);
        panel.webview.postMessage({ command: 'updateStates', data: allStat });
    }
}













function searchContent(content, query, code) {
    // console.log("content", content)
    // console.log("query",query)
    const data = [{ content }]; // Create an array with an object that has the 'content' field

    const options = {
        includeScore: true,
        keys: ['content'], // We are searching in the 'content' field
        // threshold: 0.7, // Adjust this value to control the sensitivity of the search
    };

    const fuse = new Fuse(data, options); // Create a Fuse instance with the data
    const results = fuse.search(query); // Perform the search

    return fuse.search(query);
    // console.log(result)
    // // allStates.push(result)
    // if (result[0]?.score >= 0.7) {
    //     allStates.push(code)
    // }
    // return result;
}

const DFStraversing = (rootNode, lexSelected, method, context) => {

    const stack = [rootNode];
    console.time()

    while (stack.length > 0) {
        const currentNode = stack.pop();

        currentNode.lexResult.functions.forEach(element => {
            console.log("check the current node for start of function", currentNode)
            lexSelected.functions.forEach(ele => {
                if (method === "levenshtein") {
                    if (relativeThreshold(element.normalisedBody, ele.normalisedBody, 50)) {
                        allStates.push(element.code);
                    }
                } else {
                    const fuse = searchContent(element.normalisedBody, ele.normalisedBody);
                    if (fuse[0]?.score >= 0.7) {
                        allStates.push(element.code);
                    }
                }
            });
        });

        currentNode.lexResult.classes.forEach(element => {
            lexSelected.classes.forEach(ele => {
                if (method === "levenshtein") {
                    if (relativeThreshold(element.normalisedBody, ele.normalisedBody, 50)) {
                        allStates.push(element.code);
                    }
                } else {
                    const fuse = searchContent(element.normalisedBody, ele.normalisedBody);
                    if (fuse[0]?.score >= 0.7) {
                        allStates.push(element.code);
                    }
                }
            });
        });

        currentNode.lexResult.ifElseStatements.forEach(element => {
            lexSelected.ifElseStatements.forEach(ele => {
                if (method === "levenshtein") {
                    if (relativeThreshold(element.normalisedBody, ele.normalisedBody, 50)) {
                        allStates.push(element.code);
                    }
                } else {
                    const fuse = searchContent(element.normalisedBody, ele.normalisedBody);
                    if (fuse[0]?.score >= 0.7) {
                        allStates.push(element.code);
                    }
                }
            });
        });

        currentNode.lexResult.forLoops.forEach(element => {
            lexSelected.forLoops.forEach(ele => {
                if (method === "levenshtein") {
                    if (relativeThreshold(element.normalisedBody, ele.normalisedBody, 50)) {
                        allStates.push(element.code);
                    }
                } else {
                    const fuse = searchContent(element.normalisedBody, ele.normalisedBody);
                    if (fuse[0]?.score >= 0.7) {
                        allStates.push(element.code);
                    }
                }
            });
        });

        currentNode.lexResult.switchStatements.forEach(element => {
            lexSelected.switchStatements.forEach(ele => {
                if (method === "levenshtein") {
                    if (relativeThreshold(element.normalisedBody, ele.normalisedBody, 50)) {
                        allStates.push(element.code);
                    }
                } else {
                    const fuse = searchContent(element.normalisedBody, ele.normalisedBody);
                    if (fuse[0]?.score >= 0.7) {
                        allStates.push(element.code);
                    }
                }
            });
        });

        // Push children to the stack
        for (const child of currentNode.children) {
            stack.push(child);
        }
    }

    // vscode.showInformationMessage("done traversing")
    console.timeEnd()
    createWebview(allStates, context);
    return { success: true, data: allStates };
}

const selective = (node, rootNode, context) => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const selection = editor.selection;

        const selectedText = editor.document.getText(selection);
        // console.log("selected text is ",selectedText);
        const lexSelected = parseJavaScript(selectedText);
        // console.log("\nlexed selected code : ", lexSelected);
        //levenshtein fuzzy these are two options
        const newStates = DFStraversing(rootNode, lexSelected, "fuzzy", context);
        // console.log("\n\nthese are all states : ", newStates);
        // console.log("length = ",allStates.length)
        // if (newStates.success === 'true') {

        //     createWebview(newStates, context);
        // }


    } else {
        vscode.showInformationMessage("NO avtive editor !!");
        return;
    }
    // return;
    allStates.length = 0;
}
module.exports = selective;