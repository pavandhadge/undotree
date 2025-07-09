const assert = require('assert');
const { recommendation } = require('../src/RecommendationSystem/recommendation');

describe('Recommendation System (Logic Only)', () => {
  it('Returns empty for empty AST body', () => {
    const rootNode = { parsed: { extracted: { FunctionDeclaration: [] } }, children: [] };
    const parsedData = { ast: { body: [] } };
    const result = recommendation(rootNode, parsedData);
    assert.deepStrictEqual(result, []);
  });

  it('Returns empty if no matches above threshold', () => {
    const rootNode = {
      parsed: { extracted: { FunctionDeclaration: [{ code: 'foo', ast: { type: 'FunctionDeclaration' } }] } },
      children: []
    };
    const parsedData = { ast: { body: [{ type: 'FunctionDeclaration' }] } };
    // Patch similarityIndex to always return 0
    const orig = require('../src/RecommendationSystem/similarityIndex');
    const oldSim = orig.similarityIndex;
    orig.similarityIndex = () => 0;
    // Patch getFuncRecommendations to return threshold = 0.1
    const configStore = require('../src/Config/configStore');
    const oldGet = configStore.getFuncRecommendations;
    configStore.getFuncRecommendations = () => ({ threshold: 0.1 });
    const result = recommendation(rootNode, parsedData);
    configStore.getFuncRecommendations = oldGet;
    orig.similarityIndex = oldSim;
    assert.deepStrictEqual(result, []);
  });

  it('Respects maxResults and deduplication', () => {
    const rootNode = {
      parsed: { extracted: { FunctionDeclaration: [
        { code: 'foo', ast: { type: 'FunctionDeclaration' } },
        { code: 'bar', ast: { type: 'FunctionDeclaration' } },
        { code: 'foo', ast: { type: 'FunctionDeclaration' } }, // duplicate
      ] } },
      children: []
    };
    const parsedData = { ast: { body: [{ type: 'FunctionDeclaration' }] } };
    // Patch similarityIndex to always return 1
    const orig = require('../src/RecommendationSystem/similarityIndex');
    const oldSim = orig.similarityIndex;
    orig.similarityIndex = () => 1;
    // Patch getFuncRecommendations to return maxResults = 2
    const configStore = require('../src/Config/configStore');
    const oldGet = configStore.getFuncRecommendations;
    configStore.getFuncRecommendations = () => ({ threshold: 0.1, maxResults: 2 });
    const result = recommendation(rootNode, parsedData);
    configStore.getFuncRecommendations = oldGet;
    orig.similarityIndex = oldSim;
    assert.ok(result.length <= 2);
    assert.ok(result.includes('foo'));
    assert.ok(result.includes('bar'));
  });

  it('Limits traversal depth (maxDepth)', () => {
    // Build a deep tree
    let node = { parsed: { extracted: { FunctionDeclaration: [{ code: 'deep', ast: { type: 'FunctionDeclaration' } }] } }, children: [] };
    let root = node;
    for (let i = 0; i < 200; i++) {
      node.children = [{ parsed: { extracted: { FunctionDeclaration: [{ code: 'deep'+i, ast: { type: 'FunctionDeclaration' } }] } }, children: [] }];
      node = node.children[0];
    }
    const parsedData = { ast: { body: [{ type: 'FunctionDeclaration' }] } };
    // Patch similarityIndex to always return 1
    const orig = require('../src/RecommendationSystem/similarityIndex');
    const oldSim = orig.similarityIndex;
    orig.similarityIndex = () => 1;
    // Patch getFuncRecommendations to return maxDepth = 10
    const configStore = require('../src/Config/configStore');
    const oldGet = configStore.getFuncRecommendations;
    configStore.getFuncRecommendations = () => ({ threshold: 0.1, maxDepth: 10 });
    const result = recommendation(root, parsedData);
    configStore.getFuncRecommendations = oldGet;
    orig.similarityIndex = oldSim;
    // Should not traverse all 200 nodes
    assert.ok(result.length <= 11);
  });
}); 