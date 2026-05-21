const { parseJsUsingSWC } = require("./Languages/javascript/parserJs.js");
const { parseGoUsingTreeSitter } = require("./Languages/golang/parseGo.js");
const { parsePythonUsingTreeSitter } = require("./Languages/python/parsePython.js");
const { parseJavaUsingTreeSitter } = require("./Languages/java/parseJava.js");
const { parseCppUsingTreeSitter } = require("./Languages/cpp/parseCpp.js");
const { parseCUsingTreeSitter } = require("./Languages/c/parseC.js");
const { parseCSharpUsingTreeSitter } = require("./Languages/c#/parseCSharp.js");
const { parseRustUsingTreeSitter } = require("./Languages/rust/parseRust.js");
const { parseSwiftUsingTreeSitter } = require("./Languages/swift/parseSwift.js");
const { parseKotlinUsingTreeSitter } = require("./Languages/kotlin/parseKotlin.js");
const { parseRubyUsingTreeSitter } = require("./Languages/ruby/parseRuby.js");
const { parsePHPUsingTreeSitter } = require("./Languages/php/parsePhp.js");
const { parseHTMLWithEmbeddedUsingTreeSitter } = require("./Languages/html/parseHtml.js");
const { parseCssUsingTreeSitter } = require("./Languages/css/parseCss.js");
const { parseBashUsingTreeSitter } = require("./Languages/bash/parseBash.js");

const languageParsers = {
  javascript: (text, config) => parseJsUsingSWC(text, config),
  typescript: (text, config) => parseJsUsingSWC(text, config),
  golang: (text) => parseGoUsingTreeSitter(text),
  python: (text) => parsePythonUsingTreeSitter(text),
  java: (text) => parseJavaUsingTreeSitter(text),
  cpp: (text) => parseCppUsingTreeSitter(text),
  c: (text) => parseCUsingTreeSitter(text),
  csharp: (text) => parseCSharpUsingTreeSitter(text),
  rust: (text) => parseRustUsingTreeSitter(text),
  swift: (text) => parseSwiftUsingTreeSitter(text),
  kotlin: (text) => parseKotlinUsingTreeSitter(text),
  ruby: (text) => parseRubyUsingTreeSitter(text),
  php: (text) => parsePHPUsingTreeSitter(text),
  html: (text) => parseHTMLWithEmbeddedUsingTreeSitter(text),
  css: (text) => parseCssUsingTreeSitter(text),
  bash: (text) => parseBashUsingTreeSitter(text),
};

async function parseCode(language, framework, code) {
  if (!language || typeof language !== 'object' || !language.name) {
    throw new Error("Language must be specified as an object with a 'name' property.");
  }

  if (!code || typeof code !== 'string') {
    throw new Error("Code must be a non-empty string.");
  }

  const parser = languageParsers[language.name];
  if (!parser) {
    throw new Error(`Unsupported language: ${language.name}`);
  }

  if (language.name === "javascript") {
    const config = {
      syntax: "ecmascript",
      jsx: Boolean(framework && ["react", "next.js", "solid"].includes(framework?.name)),
      isModule: language.ismodule ?? true,
      dynamicImport: true,
      minify: false,
      preserveAllComments: true,
    };
    return await parser(code, config);
  }

  if (language.name === "typescript") {
    const config = {
      syntax: "typescript",
      tsx: Boolean(framework && ["react", "next.js", "solid"].includes(framework?.name)),
      isModule: language.ismodule ?? true,
      dynamicImport: true,
      minify: false,
      preserveAllComments: true,
    };
    return await parser(code, config);
  }

  return await parser(code);
}

module.exports = { parseCode };
