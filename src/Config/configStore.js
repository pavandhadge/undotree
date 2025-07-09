let config = {};
let language = null;
let framework = null;
let funcRecommendation = null;
let vscode;
try {
  vscode = require('vscode');
} catch (e) {
  vscode = null;
}

function setConfig(newConfig) {
    config = newConfig;
    language = newConfig?.language || null;
    framework = newConfig?.framework || null;
    funcRecommendation = newConfig?.["func-recommendation"] || null;

    console.log("Config updated:", config);
    console.log("Language settings:", language);
    console.log("Framework settings:", framework);
    console.log("Function recommendation settings:", funcRecommendation);
}

function getConfig() {
    return config;
}
function getFuncRecommendations() {
    let rec = config?.["func-recommendation"] ? { ...config["func-recommendation"] } : {};
    if (vscode) {
      const userThreshold = vscode.workspace.getConfiguration('rewindcode.recommendation').get('threshold');
      const userMaxResults = vscode.workspace.getConfiguration('rewindcode.recommendation').get('maxResults');
      const userMaxDepth = vscode.workspace.getConfiguration('rewindcode.recommendation').get('maxDepth');
      if (typeof userThreshold === 'number') rec.threshold = userThreshold;
      if (typeof userMaxResults === 'number') rec.maxResults = userMaxResults;
      if (typeof userMaxDepth === 'number') rec.maxDepth = userMaxDepth;
    }
    return rec;
}
function getLanguage() {
    return language;
}
function getFramework() {
    return framework;
}
module.exports = { setConfig, getConfig, getLanguage, getFramework, getFuncRecommendations };
