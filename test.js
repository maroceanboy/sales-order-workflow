// Integrity test — run with: node test.js
// Validates data.js and the structural wiring between workflow.html, style.css and app.js,
// so content and code edits fail loudly instead of breaking the page silently.
const fs = require("fs");

const read = f => fs.readFileSync(__dirname + "/" + f, "utf8");
const dataSrc = read("data.js");
const dataDaSrc = read("data-da.js");
const html = read("workflow.html");
const css = read("style.css");
const js = read("app.js");
eval(dataSrc.replace("const NODES", "var NODES"));
eval(dataDaSrc.replace("const NODES_DA", "var NODES_DA"));

let failures = 0;
const fail = msg => { console.error("  FAIL: " + msg); failures++; };
const pass = msg => console.log("  ok: " + msg);

// ---- 1. NODES structure ----
const FIELDS = {
  num: "string", kind: "string", dept: "string", deptName: "string",
  title: "string", who: "string", tasks: "object", outcomes: "object"
};
let structOk = true;
NODES.forEach(n => {
  for (const [f, type] of Object.entries(FIELDS)) {
    if (typeof n[f] !== type || n[f] === null) { fail(`${f} missing/wrong type in node ${n.num}`); structOk = false; }
  }
  if (!Array.isArray(n.tasks) || !n.tasks.length) { fail(`tasks empty in node ${n.num}`); structOk = false; }
  if (!Array.isArray(n.outcomes) || !n.outcomes.length) { fail(`outcomes empty in node ${n.num}`); structOk = false; }
  n.outcomes.forEach((o, j) => {
    if (!o.when || !o.then) { fail(`outcome ${j} in node ${n.num} missing when/then`); structOk = false; }
  });
});
if (structOk) pass(`all ${NODES.length} nodes have complete fields and non-empty tasks/outcomes`);

// ---- 2. kinds and numbering ----
const stages = NODES.filter(n => n.kind === "stage");
const branches = NODES.filter(n => n.kind === "branch");

stages.forEach(n => {
  if (!/^[1-9]$/.test(n.num)) fail(`stage num "${n.num}" must be a single digit 1-9`);
});
stages.forEach((n, i) => {
  if (n.num !== String(i + 1)) fail(`stage sequence broken at position ${i}: got "${n.num}", expected "${i + 1}"`);
});
const nums = NODES.map(n => n.num);
const dup = nums.filter((v, i) => nums.indexOf(v) !== i);
if (dup.length) fail(`duplicate nums: ${dup.join(", ")}`);

const stageNums = new Set(stages.map(n => n.num));
let branchOk = true;
branches.forEach(n => {
  const parent = n.num.charAt(0);
  if (!stageNums.has(parent)) { fail(`branch ${n.num} has no parent stage "${parent}"`); branchOk = false; }
  if (n.num.length < 2) { fail(`branch num "${n.num}" must be parent digit + suffix (e.g. "2a")`); branchOk = false; }
  if (NODES.indexOf(n) < NODES.findIndex(x => x.kind === "stage" && x.num === parent)) {
    fail(`branch ${n.num} appears before its parent stage in data.js`); branchOk = false;
  }
});
if (branchOk && branches.length) pass(`all ${branches.length} branches attach to an existing stage, ordered after it`);

// ---- 2b. Danish translation is complete ----
let daOk = true;
NODES.forEach(n => {
  const da = NODES_DA[n.num];
  if (!da) { fail(`data-da.js missing node ${n.num}`); daOk = false; return; }
  for (const f of ["title", "deptName", "who"]) {
    if (typeof da[f] !== "string" || !da[f].trim()) { fail(`data-da.js ${n.num} missing ${f}`); daOk = false; }
  }
  if (!Array.isArray(da.tasks) || !da.tasks.length) { fail(`data-da.js ${n.num} missing tasks`); daOk = false; }
  if (!Array.isArray(da.outcomes) || !da.outcomes.length) { fail(`data-da.js ${n.num} missing outcomes`); daOk = false; }
  (da.outcomes || []).forEach((o, j) => {
    if (!o.when || !o.then) { fail(`data-da.js ${n.num} outcome ${j} missing when/then`); daOk = false; }
  });
  (da.tasks || []).forEach((t, j) => {
    if (!t.trim()) { fail(`data-da.js ${n.num} task ${j} empty`); daOk = false; }
  });
});
if (daOk) pass(`Danish content complete for all ${NODES.length} nodes`);
const daNums = Object.keys(NODES_DA);
const stale = daNums.filter(k => !nums.includes(k));
if (stale.length) fail(`data-da.js contains translations for non-existent nodes: ${stale.join(", ")}`);

// ---- 3. every dept used in data has a badge class AND a sidebar dot (in style.css) ----
const depts = [...new Set(NODES.map(n => n.dept))];
const missingBadge = depts.filter(d => !css.includes(`.badge.${d}`));
const missingDot = depts.filter(d => !css.includes(`.dept-dot.${d}`));
if (missingBadge.length) fail(`style.css missing badge CSS for dept(s): ${missingBadge.join(", ")}`);
else if (missingDot.length) fail(`style.css missing sidebar dot CSS for dept(s): ${missingDot.join(", ")}`);
else pass(`all ${depts.length} depts have badge + sidebar dot CSS (${depts.join(", ")})`);

// ---- 4. file structure: thin HTML shell + external css/js ----
if (html.includes("<style>")) fail("workflow.html must not inline <style> (keep CSS in style.css)");
if (/[`"]?\s*<script>\s*\n/.test(html)) fail("workflow.html must not inline scripts (keep JS in app.js)");
const orderOk = css.length > 0 &&
  html.indexOf('href="style.css"') < html.indexOf('src="data.js"') &&
  html.indexOf('src="data.js"') < html.indexOf('src="data-da.js"') &&
  html.indexOf('src="data-da.js"') < html.indexOf('src="app.js"');
if (!orderOk) fail("workflow.html must load style.css, then data.js, then data-da.js, then app.js");
else pass("correct file split and load order (style.css -> data.js -> data-da.js -> app.js)");

// ---- 5. every id referenced by app.js exists in workflow.html ----
const jsIds = [...new Set([...js.matchAll(/getElementById\("([^"]+)"\)/g)].map(m => m[1]))];
const htmlIds = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
const missingIds = jsIds.filter(id => !htmlIds.has(id));
if (missingIds.length) fail(`app.js references missing id(s): ${missingIds.join(", ")}`);
else pass(`all ${jsIds.length} ids referenced by app.js exist in workflow.html`);

// ---- 6. search + helper + sidebar tree controls wired ----
const wiring = [
  ["id=\"langs\"", "language toggle in workflow.html"],
  ["data-lang=\"da\"", "Danish option in workflow.html"],
  ["d-responsible", "localizable Responsible label"],
  ["d-tasks-label", "localizable Tasks label"],
  ["d-outcomes-label", "localizable Outcomes label"],
  ["role=\"tree\"", "sidebar tree role in workflow.html"],
  ["id=\"rail\"", "progress rail in HTML"],
  [".rail", "progress rail styles in style.css"],
  [".notch", "rail notch styles in style.css"],
  [".bgroup", "collapsible group styles in style.css"],
  [".caret", "disclosure caret styles in style.css"],
  [".dept-dot", "department dot styles in style.css"],
  ["#searchBox", "search input in HTML"],
  ["searchCount", "match-count element in HTML"],
  ["#helpBtn", "shortcuts button in HTML"],
  ["helpBox", "shortcuts overlay in HTML"],
  [".helpbox", "helpbox styles in style.css"],
  [".stage-card.dim", "search dim styles in style.css"],
];
wiring.forEach(([needle, what]) => {
  const found = html.includes(needle) || css.includes(needle) ||
    html.includes(needle.replace(/[.#]/g, "")) || css.includes(needle.replace(/[.#]/g, ""));
  if (!found) fail(what + " not wired: " + needle);
});
const ariaBits = [
  [js.includes("setLang") && js.includes("applyLang"), "language switching wired in app.js"],
  [js.includes("wf-lang") && js.includes("localStorage.setItem"), "language persisted via localStorage"],
  [js.includes("NODES_DA[n.num]"), "app.js reads localized node content"],
  [js.split("const STR").length - 1 >= 1 && js.includes("da: {"), "Danish UI string table present"],
  [js.includes("groupsInitialized"), "rebuild keeps user's collapse state across language switches"],
  [js.includes("openStep(current, true)"), "open node re-renders on language switch without stopping the tour"],
  [js.includes("keyHint(str(\"orPress\"), \"→\", \"\")"), "stage-view key hint renders the → keycap, localized"],
  [js.includes("keyHint(str(\"goBackLeft\"), \"←\", str(\"goBackRight\"))"), "branch-view key hint renders the ← keycap, localized"],
  [!css.includes("text-overflow"), "sidebar titles wrap — all words visible, no ellipsis"],
  [!js.includes("text.slice(-1)"), "no fragile string slicing in key hints (must pass explicit arguments)"],
  [js.includes('"treeitem"'), "treeitem role set in app.js"],
  [js.includes('"aria-level"'), "aria-level set in app.js"],
  [js.includes('"aria-expanded"'), "aria-expanded on stage treeitems"],
  [js.includes('"aria-current"'), "aria-current on the active treeitem"],
  [js.includes('"group"'), "branch groups have role=group"],
  [js.includes("tabIndex = 0"), "treeitems are focusable"],
  [js.includes("applySearch() {") && js.includes("expandGroup(num)"), "search reveals collapsed groups"],
  [js.includes("toggleGroup"), "caret click toggles collapse"],
  [js.includes("COLLAPSED.add(n.num)"), "left arrow collapses a stage group"],
  [js.includes("goBackToStage"), "back handled through goBackToStage"],
  [js.includes("COLLAPSED.add(num);\n  applyGroupState(num);\n  openStep(stageIndexByNum[num]);"), "going back folds the paths away"],
  [js.includes("foldGroup"), "list navigation folds groups behind you"],
  [js.includes("sameGroup"), "sibling paths stay visible when hopping between them"],
  [js.includes("COLLAPSED.add(sNum)"), "branch groups start hidden"],
  [js.includes("!COLLAPSED.has(x.n.num.charAt(0))"), "up/down skips hidden branches"],
  [js.includes("expandGroup(parent)"), "opening a branch reveals its group"],
  [js.includes("updateRail"), "rail updates on navigation"],
];
ariaBits.forEach(([ok, what]) => { if (!ok) fail(what); });
pass("sidebar tree, collapsible groups, dept dots, rail, search and helper all wired");

// ---- 7. text sanity ----
let degenerate = [];
NODES.forEach(n => {
  if (!n.title.trim()) degenerate.push("title " + n.num);
  if (!n.who.trim()) degenerate.push("who " + n.num);
  n.tasks.forEach((t, j) => { if (!t.trim()) degenerate.push(`task ${n.num}#${j}`); });
});
if (degenerate.length) fail(`empty strings: ${degenerate.join(", ")}`);
else pass("no empty strings");

// ---- 8. themes fully override the base palette ----
const grab = b => [...b.matchAll(/(--[a-z-]+)/g)].map(m => m[1]);
const root = grab(css.split("body.theme-night")[0]);
const night = grab(css.split("body.theme-night")[1].split("body.theme-contrast")[0]);
const contrast = grab(css.split("body.theme-contrast")[1].split(/\.[a-z]/)[0]);
if (!root.every(v => night.includes(v))) fail("night theme does not override all CSS variables");
else if (!root.every(v => contrast.includes(v))) fail("contrast theme does not override all CSS variables");
else pass(`all ${root.length} palette variables overridden in night and contrast themes`);

console.log("");
if (failures) { console.log(`${failures} problem(s) found.`); process.exit(1); }
console.log(`ALL OK — ${stages.length} stages, ${branches.length} branches, ${NODES.length} nodes, structure verified.`);
