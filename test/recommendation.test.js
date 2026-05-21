const assert = require("assert");

const { setConfig } = require("../src/Config/configStore");
const { parseCode } = require("../src/parse");
const { recommendation } = require("../src/RecommendationSystem/recommendation");

suite("Recommendation System", () => {
  const language = { name: "javascript" };

  setup(() => {
    setConfig({
      language,
      framework: null,
      "func-recommendation": {
        active: true,
        threshold: 0.7,
      },
    });
  });

  test("ranks same-name function history above renamed functions and filters unrelated functions", async () => {
    const state = [
      "function addTotal(a,b){ return a+b; }",
      "function renderUser(user){ return user.name; }",
      "function sumTotal(a,b){ const total=a+b; return total; }",
    ].join("\n");
    const selected = "function addTotal(a,b){ const total = a + b; return total; }";
    const root = {
      state,
      children: [],
      parsed: await parseCode(language, null, state),
    };
    const parsedSelection = await parseCode(language, null, selected);

    const suggestions = await recommendation(root, parsedSelection, selected);

    assert.strictEqual(suggestions[0].code, "function addTotal(a,b){ return a+b; }");
    assert.ok(suggestions.some((suggestion) => suggestion.code === "function sumTotal(a,b){ const total=a+b; return total; }"));
    assert.ok(!suggestions.some((suggestion) => suggestion.code.includes("renderUser")));
    assert.ok(suggestions.every((suggestion) => suggestion.similarity >= 0.7 && suggestion.similarity <= 1));
  });

  test("does not recommend inner statements when a function is selected", async () => {
    const state = [
      "function addTotal(a,b){ const total=a+b; return total; }",
      "function renderUser(user){ return user.name; }",
    ].join("\n");
    const selected = "function addTotal(a,b){ const total = a + b; return total; }";
    const root = {
      state,
      children: [],
      parsed: await parseCode(language, null, state),
    };
    const parsedSelection = await parseCode(language, null, selected);

    const suggestions = await recommendation(root, parsedSelection, selected);

    assert.ok(suggestions.length > 0);
    assert.ok(suggestions.every((suggestion) => suggestion.code.trim().startsWith("function")));
  });

  test("supports const arrow function versions by using declaration names", async () => {
    const state = [
      "const normalizeName = (name) => name.trim().toLowerCase();",
      "const renderUser = (user) => user.name;",
    ].join("\n");
    const selected = "const normalizeName = (value) => value.trim().toLowerCase();";
    const root = {
      state,
      children: [],
      parsed: await parseCode(language, null, state),
    };
    const parsedSelection = await parseCode(language, null, selected);

    const suggestions = await recommendation(root, parsedSelection, selected);

    assert.strictEqual(suggestions[0].code, "const normalizeName = (name) => name.trim().toLowerCase();");
    assert.ok(!suggestions.some((suggestion) => suggestion.code.includes("renderUser")));
  });

  const languageCases = [
    {
      name: "javascript",
      previous: "function addTotal(a,b){ return a+b; }",
      selected: "function addTotal(a,b){ const total = a + b; return total; }",
      distractor: "function renderUser(user){ return user.name; }",
      expected: "addTotal",
      rejected: "renderUser",
    },
    {
      name: "typescript",
      previous: "function addTotal(a: number, b: number): number { return a + b; }",
      selected: "function addTotal(a: number, b: number): number { const total = a + b; return total; }",
      distractor: "function renderUser(user: { name: string }): string { return user.name; }",
      expected: "addTotal",
      rejected: "renderUser",
    },
    {
      name: "python",
      previous: "def add_total(a, b):\n    return a + b",
      selected: "def add_total(a, b):\n    total = a + b\n    return total",
      distractor: "def render_user(user):\n    return user.name",
      expected: "add_total",
      rejected: "render_user",
    },
    {
      name: "golang",
      previous: "func addTotal(a int, b int) int {\n\treturn a + b\n}",
      selected: "func addTotal(a int, b int) int {\n\ttotal := a + b\n\treturn total\n}",
      distractor: "func renderUser(user User) string {\n\treturn user.Name\n}",
      expected: "addTotal",
      rejected: "renderUser",
    },
    {
      name: "java",
      previous: "int addTotal(int a, int b) { return a + b; }",
      selected: "int addTotal(int a, int b) { int total = a + b; return total; }",
      distractor: "String renderUser(User user) { return user.name; }",
      expected: "addTotal",
      rejected: "renderUser",
    },
    {
      name: "cpp",
      previous: "int addTotal(int a, int b) { return a + b; }",
      selected: "int addTotal(int a, int b) { int total = a + b; return total; }",
      distractor: "std::string renderUser(User user) { return user.name; }",
      expected: "addTotal",
      rejected: "renderUser",
    },
    {
      name: "c",
      previous: "int add_total(int a, int b) { return a + b; }",
      selected: "int add_total(int a, int b) { int total = a + b; return total; }",
      distractor: "char *render_user(User user) { return user.name; }",
      expected: "add_total",
      rejected: "render_user",
    },
    {
      name: "csharp",
      previous: "int AddTotal(int a, int b) { return a + b; }",
      selected: "int AddTotal(int a, int b) { int total = a + b; return total; }",
      distractor: "string RenderUser(User user) { return user.Name; }",
      expected: "AddTotal",
      rejected: "RenderUser",
    },
    {
      name: "rust",
      previous: "fn add_total(a: i32, b: i32) -> i32 {\n    a + b\n}",
      selected: "fn add_total(a: i32, b: i32) -> i32 {\n    let total = a + b;\n    total\n}",
      distractor: "fn render_user(user: User) -> String {\n    user.name\n}",
      expected: "add_total",
      rejected: "render_user",
    },
    {
      name: "swift",
      previous: "func addTotal(_ a: Int, _ b: Int) -> Int { return a + b }",
      selected: "func addTotal(_ a: Int, _ b: Int) -> Int { let total = a + b; return total }",
      distractor: "func renderUser(_ user: User) -> String { return user.name }",
      expected: "addTotal",
      rejected: "renderUser",
    },
    {
      name: "kotlin",
      previous: "fun addTotal(a: Int, b: Int): Int { return a + b }",
      selected: "fun addTotal(a: Int, b: Int): Int { val total = a + b; return total }",
      distractor: "fun renderUser(user: User): String { return user.name }",
      expected: "addTotal",
      rejected: "renderUser",
    },
    {
      name: "ruby",
      previous: "def add_total(a, b)\n  a + b\nend",
      selected: "def add_total(a, b)\n  total = a + b\n  total\nend",
      distractor: "def render_user(user)\n  user.name\nend",
      expected: "add_total",
      rejected: "render_user",
    },
    {
      name: "php",
      previous: "<?php\nfunction addTotal($a, $b) { return $a + $b; }",
      selected: "<?php\nfunction addTotal($a, $b) { $total = $a + $b; return $total; }",
      distractor: "<?php\nfunction renderUser($user) { return $user->name; }",
      expected: "addTotal",
      rejected: "renderUser",
    },
    {
      name: "html",
      previous: "<button class=\"save-action\">Save</button>",
      selected: "<button class=\"save-action\" type=\"button\">Save</button>",
      distractor: "<nav class=\"user-menu\">Profile</nav>",
      expected: "save-action",
      rejected: "user-menu",
    },
    {
      name: "css",
      previous: ".save-action { color: red; padding: 4px; }",
      selected: ".save-action { color: red; padding: 8px; }",
      distractor: ".user-menu { display: flex; gap: 8px; }",
      expected: "save-action",
      rejected: "user-menu",
    },
    {
      name: "bash",
      previous: "add_total() {\n  echo $(($1 + $2))\n}",
      selected: "add_total() {\n  local total=$(($1 + $2))\n  echo $total\n}",
      distractor: "render_user() {\n  echo \"$USER\"\n}",
      expected: "add_total",
      rejected: "render_user",
    },
  ];

  languageCases.forEach((testCase) => {
    test(`recommends relevant snippets for ${testCase.name}`, async () => {
      const caseLanguage = { name: testCase.name };
      setConfig({
        language: caseLanguage,
        framework: null,
        "func-recommendation": {
          active: true,
          threshold: 0.7,
        },
      });
      const state = [testCase.previous, testCase.distractor].join("\n\n");
      const root = {
        state,
        children: [],
        parsed: await parseCode(caseLanguage, null, state),
      };
      const parsedSelection = await parseCode(caseLanguage, null, testCase.selected);

      const suggestions = await recommendation(root, parsedSelection, testCase.selected);

      assert.ok(suggestions.length > 0, `${testCase.name} should produce at least one suggestion`);
      assert.ok(suggestions[0].code.includes(testCase.expected), `${testCase.name} should rank the matching snippet first`);
      assert.ok(!suggestions.some((suggestion) => suggestion.code.includes(testCase.rejected)), `${testCase.name} should filter unrelated snippets`);
    });
  });

  ["react", "next.js", "solid"].forEach((frameworkName) => {
    test(`supports javascript JSX recommendations for ${frameworkName}`, async () => {
      const caseLanguage = { name: "javascript" };
      const framework = { name: frameworkName };
      setConfig({
        language: caseLanguage,
        framework,
        "func-recommendation": {
          active: true,
          threshold: 0.7,
        },
      });
      const previous = "function UserCard({ user }) { return <article>{user.name}</article>; }";
      const selected = "function UserCard({ user }) { return <article className=\"card\">{user.name}</article>; }";
      const distractor = "function SettingsPanel({ settings }) { return <section>{settings.title}</section>; }";
      const root = {
        state: [previous, distractor].join("\n"),
        children: [],
        parsed: await parseCode(caseLanguage, framework, [previous, distractor].join("\n")),
      };
      const parsedSelection = await parseCode(caseLanguage, framework, selected);

      const suggestions = await recommendation(root, parsedSelection, selected);

      assert.ok(suggestions.length > 0);
      assert.ok(suggestions[0].code.includes("UserCard"));
      assert.ok(!suggestions.some((suggestion) => suggestion.code.includes("SettingsPanel")));
    });
  });

  ["react", "next.js", "solid"].forEach((frameworkName) => {
    test(`supports typescript TSX recommendations for ${frameworkName}`, async () => {
      const caseLanguage = { name: "typescript" };
      const framework = { name: frameworkName };
      setConfig({
        language: caseLanguage,
        framework,
        "func-recommendation": {
          active: true,
          threshold: 0.7,
        },
      });
      const props = "type Props = { user: { name: string } };";
      const previous = "function UserCard({ user }: Props) { return <article>{user.name}</article>; }";
      const selected = "function UserCard({ user }: Props) { return <article className=\"card\">{user.name}</article>; }";
      const distractor = "function SettingsPanel({ user }: Props) { return <section>{user.name}</section>; }";
      const rootState = [props, previous, distractor].join("\n");
      const root = {
        state: rootState,
        children: [],
        parsed: await parseCode(caseLanguage, framework, rootState),
      };
      const parsedSelection = await parseCode(caseLanguage, framework, [props, selected].join("\n"));

      const suggestions = await recommendation(root, parsedSelection, selected);

      assert.ok(suggestions.length > 0);
      assert.ok(suggestions[0].code.includes("UserCard"));
      assert.ok(!suggestions.some((suggestion) => suggestion.code.includes("SettingsPanel")));
    });
  });
});
