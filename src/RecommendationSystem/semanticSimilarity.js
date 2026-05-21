function getChildren(node) {
  if (!node || typeof node !== "object") return [];

  if (Array.isArray(node.children)) return node.children.filter(Boolean);

  const children = [];
  for (const key in node) {
    if (["span", "loc", "range", "parent", "tree", "leadingComments", "trailingComments", "extra", "ctxt"].includes(key)) continue;

    const value = node[key];
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item && typeof item === "object" && item.type) children.push(item);
      });
    } else if (value && typeof value === "object" && value.type) {
      children.push(value);
    }
  }

  return children;
}

function normalizeText(value) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenize(value) {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(/\s+/) : [];
}

function levenshteinSimilarity(left, right) {
  const a = normalizeText(left);
  const b = normalizeText(right);

  if (!a && !b) return 1;
  if (!a || !b) return 0;
  if (a === b) return 1;

  const dp = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  return 1 - dp[a.length][b.length] / Math.max(a.length, b.length);
}

function jaccardSimilarity(left, right) {
  const leftSet = new Set(left.filter(Boolean));
  const rightSet = new Set(right.filter(Boolean));

  if (leftSet.size === 0 && rightSet.size === 0) return 1;
  if (leftSet.size === 0 || rightSet.size === 0) return 0;

  let intersection = 0;
  leftSet.forEach((item) => {
    if (rightSet.has(item)) intersection++;
  });

  return intersection / new Set([...leftSet, ...rightSet]).size;
}

function findNameInTreeSitterNode(node, depth = 0) {
  if (!node || typeof node !== "object" || depth > 4) return "";

  if (["identifier", "property_identifier", "field_identifier", "type_identifier"].includes(node.type) && node.text) {
    return node.text;
  }

  if (typeof node.childForFieldName === "function") {
    const nameNode = node.childForFieldName("name");
    if (nameNode?.text) return nameNode.text;

    const declarator = node.childForFieldName("declarator");
    const declaratorName = findNameInTreeSitterNode(declarator, depth + 1);
    if (declaratorName) return declaratorName;
  }

  for (const child of getChildren(node)) {
    const childName = findNameInTreeSitterNode(child, depth + 1);
    if (childName) return childName;
  }

  return "";
}

function getNodeName(node) {
  if (!node || typeof node !== "object") return "";

  if (node.identifier?.value) return node.identifier.value;
  if (node.identifier?.name) return node.identifier.name;
  if (node.id?.value) return node.id.value;
  if (node.id?.name) return node.id.name;
  if (node.name?.value) return node.name.value;
  if (node.name?.text) return node.name.text;
  if (node.key?.value) return node.key.value;
  if (node.key?.name) return node.key.name;
  if (node.declarator?.name?.text) return node.declarator.name.text;
  if (node.declarations?.[0]?.id?.value) return node.declarations[0].id.value;
  if (node.declarations?.[0]?.id?.name) return node.declarations[0].id.name;
  if (node.declarations?.[0]?.id?.text) return node.declarations[0].id.text;
  if (node.declarations?.[0]?.name?.value) return node.declarations[0].name.value;
  if (node.declarations?.[0]?.name?.text) return node.declarations[0].name.text;
  const treeSitterName = findNameInTreeSitterNode(node);
  if (treeSitterName) return treeSitterName;

  return "";
}

function getEntryName(entry) {
  return entry?.name || getNodeName(entry?.ast);
}

function getReturnType(node) {
  if (!node || typeof node !== "object") return "";

  if (node.returnType?.typeAnnotation?.type) return node.returnType.typeAnnotation.type;
  if (node.returnType?.type) return node.returnType.type;
  if (node.result?.type) return node.result.type;

  return "";
}

function getNodeCategory(node) {
  const type = node?.type || "";
  const normalizedType = type.toLowerCase().replace(/[^a-z0-9]/g, "");

  if ([
    "FunctionDeclaration",
    "FunctionExpression",
    "ArrowFunctionExpression",
    "MethodDefinition",
    "function_declaration",
    "function_definition",
    "method_declaration",
    "method_definition",
    "MethodDeclaration",
    "FunctionDefinition",
    "FunctionItem",
    "FunctionDeclaration",
    "arrow_function",
  ].includes(type)) {
    return "function";
  }

  if (normalizedType.includes("function") || normalizedType.includes("methoddeclaration") || normalizedType.includes("methoddefinition")) {
    return "function";
  }

  if (type === "VariableDeclaration" || normalizedType.includes("variabledeclaration")) {
    const initType = node.declarations?.[0]?.init?.type;
    return ["FunctionExpression", "ArrowFunctionExpression"].includes(initType) ? "function" : "variable";
  }

  if (normalizedType.includes("class") || normalizedType.includes("struct") || normalizedType.includes("interface")) return "type";
  if (normalizedType.includes("import") || normalizedType.includes("include")) return "import";
  if (normalizedType.includes("statement") || normalizedType.includes("expression")) return "statement";

  return type || "unknown";
}

function summarizeExpression(node) {
  if (!node || typeof node !== "object") return "";

  if (node.value !== undefined && node.value !== null) return normalizeText(node.value);
  if (node.raw) return normalizeText(node.raw);
  if (node.name) return normalizeText(node.name);
  if (node.value?.value) return normalizeText(node.value.value);
  if (node.operator) return normalizeText(node.operator);
  if (node.text) return normalizeText(node.text);
  if (node.type) return normalizeText(node.type);

  return "";
}

function collectFeatures(node, features = { structure: [], identifiers: [], literals: [], returns: [], returnTypes: [] }) {
  if (!node || typeof node !== "object") return features;

  if (node.type) features.structure.push(node.type);

  const name = getNodeName(node);
  if (name) features.identifiers.push(...tokenize(name));

  if (typeof node.value === "string" || typeof node.value === "number" || typeof node.value === "boolean") {
    features.literals.push(normalizeText(node.value));
  }
  if (typeof node.raw === "string") features.literals.push(normalizeText(node.raw));
  if (typeof node.text === "string" && getChildren(node).length === 0) {
    const text = normalizeText(node.text);
    if (text && text !== normalizeText(node.type)) {
      if (["identifier", "property_identifier", "field_identifier", "type_identifier"].includes(node.type)) {
        features.identifiers.push(...tokenize(text));
      } else {
        features.literals.push(text);
      }
    }
  }

  const returnType = getReturnType(node);
  if (returnType) features.returnTypes.push(normalizeText(returnType));

  if ((node.type || "").toLowerCase().replace(/[^a-z0-9]/g, "") === "returnstatement") {
    const argument = node.argument || node.expression || node.childForFieldName?.("argument");
    features.returns.push(summarizeExpression(argument || node));
  }

  getChildren(node).forEach((child) => collectFeatures(child, features));
  return features;
}

function sequenceSimilarity(left, right) {
  if (left.length === 0 && right.length === 0) return 1;
  if (left.length === 0 || right.length === 0) return 0;

  const dp = Array(left.length + 1)
    .fill(null)
    .map(() => Array(right.length + 1).fill(0));

  for (let i = 1; i <= left.length; i++) {
    for (let j = 1; j <= right.length; j++) {
      if (left[i - 1] === right[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[left.length][right.length] / Math.max(left.length, right.length);
}

function semanticSimilarity(entry1, entry2) {
  const ast1 = entry1?.ast;
  const ast2 = entry2?.ast;
  const features1 = collectFeatures(ast1);
  const features2 = collectFeatures(ast2);

  const name1 = getEntryName(entry1);
  const name2 = getEntryName(entry2);
  const nameScore = name1 || name2
    ? Math.max(levenshteinSimilarity(name1, name2), jaccardSimilarity(tokenize(name1), tokenize(name2)))
    : 0.5;

  const returnScore = Math.max(
    jaccardSimilarity(features1.returnTypes, features2.returnTypes),
    jaccardSimilarity(features1.returns, features2.returns)
  );
  const valueScore = Math.max(
    jaccardSimilarity(features1.literals, features2.literals),
    jaccardSimilarity(features1.identifiers, features2.identifiers)
  );
  const textScore = jaccardSimilarity(tokenize(entry1?.code), tokenize(entry2?.code));
  const structureScore = sequenceSimilarity(features1.structure, features2.structure);

  const score = (nameScore * 0.42) + (returnScore * 0.13) + (valueScore * 0.1) + (textScore * 0.15) + (structureScore * 0.2);

  return {
    score,
    hasName: Boolean(name1 || name2),
    nameScore,
    returnScore,
    valueScore,
    textScore,
    structureScore,
  };
}

module.exports = { semanticSimilarity, getNodeCategory, getEntryName };
