const vscode = require('vscode');
const path = require('path');
const { setConfig } = require("./configStore");

let lastFolder = null;
let lastLoadedFile = null;
let configLoadTimeout = null;

function pathsMatchWithBoundary(dir, workspaceFolder) {
    if (!dir.startsWith(workspaceFolder)) return false;
    if (dir === workspaceFolder) return true;
    return dir[workspaceFolder.length] === path.sep;
}

async function findUndotreeJson(filePath) {
    if (!vscode.workspace.workspaceFolders) return -1;

    const dir = path.dirname(filePath);

    for (const workspaceFolder of vscode.workspace.workspaceFolders) {
        const workspacePath = workspaceFolder.uri.fsPath;
        if (!pathsMatchWithBoundary(dir, workspacePath)) continue;

        let currentDir = dir;
        while (pathsMatchWithBoundary(currentDir, workspacePath)) {
            const jsonUri = vscode.Uri.file(path.join(currentDir, 'undotree.config.json'));
            try {
                await vscode.workspace.fs.stat(jsonUri);
                const content = await vscode.workspace.fs.readFile(jsonUri);
                const text = new TextDecoder().decode(content);

                if (jsonUri.fsPath === lastLoadedFile) {
                    return 0;
                }

                const parsedConfig = JSON.parse(text);
                if (!parsedConfig || typeof parsedConfig !== 'object') {
                    console.error(`Invalid config file format: ${jsonUri.fsPath}`);
                    return -1;
                }

                lastLoadedFile = jsonUri.fsPath;
                setConfig(parsedConfig);
                return 1;
            } catch (error) {
                if (error.message.includes('ENOENT') || error.message.includes('FileNotFound')) {
                    const parentDir = path.dirname(currentDir);
                    if (parentDir === currentDir) break;
                    currentDir = parentDir;
                    continue;
                }
                if (error instanceof SyntaxError) {
                    throw error;
                }
                const parentDir = path.dirname(currentDir);
                if (parentDir === currentDir) break;
                currentDir = parentDir;
            }
        }
    }

    return -1;
}

async function trackEditorChanges(editor) {
    if (!editor) return;
    const filePath = editor.document.uri.fsPath;
    const folder = path.dirname(filePath);

    if (folder !== lastFolder) {
        lastFolder = folder;

        if (configLoadTimeout) {
            clearTimeout(configLoadTimeout);
        }

        return new Promise((resolve) => {
            configLoadTimeout = setTimeout(async () => {
                try {
                    const result = await findUndotreeJson(filePath);
                    resolve(result);
                } catch (error) {
                    console.error("Error loading config:", error);
                    resolve(-1);
                }
            }, 100);
        });
    }
    return 0;
}

module.exports = { trackEditorChanges };
