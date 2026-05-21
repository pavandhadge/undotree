let config = {};
let language = null;
let framework = null;
let funcRecommendation = null;

function setConfig(newConfig) {
    if (!newConfig || typeof newConfig !== 'object') {
        return;
    }

    config = newConfig;
    language = newConfig?.language || null;
    framework = newConfig?.framework || null;
    funcRecommendation = newConfig?.["func-recommendation"] || null;
}

function getConfig() {
    return config;
}

function getFuncRecommendations() {
    return funcRecommendation;
}

function getLanguage() {
    return language;
}

function getFramework() {
    return framework;
}

module.exports = { setConfig, getConfig, getLanguage, getFramework, getFuncRecommendations };
