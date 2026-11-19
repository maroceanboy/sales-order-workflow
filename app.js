const sidebar = document.getElementById("sidebar");
const tourBtn = document.getElementById("tourBtn");
let current = -1;

/* ---- language layer ---- */
let LANG = "en";

/* localized view of a node: Danish fields override English when da is active */
const L = n => LANG === "da"
  ? Object.assign({ num: n.num, kind: n.kind, dept: n.dept }, NODES_DA[n.num])
  : n;

const STR = {
  en: {
    headerTitle: "Sales Order Workflow",
    headerHint: 'Walk the list with <kbd>↑</kbd> <kbd>↓</kbd> · <kbd>→</kbd> into what could go wrong · <kbd>←</kbd> back out · or start the tour.',
    mapLabel: 'Workflow · walk with <kbd>↑</kbd><kbd>↓</kbd>',
    sidebarLabel: "Workflow map: stages with exception paths",
    searchLabel: "Search the workflow",
    searchPlaceholder: "Search tasks, roles, outcomes…",
    startTour: "Start tour", stopTour: "Stop tour",
    themeLight: "Light", themeNight: "Night", themeContrast: "Contrast",
    responsible: "Responsible:",
    tasks: "Tasks", outcomes: "Outcomes",
    stageOf: "Stage {n} of {t}",
    branchOf: "Branch off stage {n}",
    ifGoesWrong: "If it goes wrong:",
    alsoUnder: "Also under stage {n}:",
    backToStage: "↩ Back to stage {n}",
    orPress: "or press ", goBackLeft: "press ", goBackRight: " to go back",
    matchOne: "{n} match", matchMany: "{n} matches", matchNone: "no matches",
    footText: "Departments involved: Sales · Finance · Warehouse · Production/QC · Logistics · Purchasing.<br>Key metrics to watch: order cycle time · fill rate · on-time delivery · DSO · return rate.",
    backToStart: "Back to start",
    groupOf: "Exception paths of stage {n}",
    prevNode: "Previous node", nextNode: "Next node",
    printTitle: "Sales Order Workflow — reference sheet",
    printSub: "Distribution business · main stages 1-7, exception paths in grey numbering (e.g. 2a)",
    helpTitle: "Shortcuts",
    helpRows: [
      ["<kbd>↑</kbd> <kbd>↓</kbd>", "previous / next visible node (collapsed paths are skipped)"],
      ["<kbd>→</kbd>", "expand a stage's exception paths and open them"],
      ["<kbd>←</kbd>", "back to the stage — its exception paths fold away"],
      ["<kbd>Enter</kbd>", "open first search match"],
      ["<kbd>Esc</kbd>", "clear search, close help, back to start"],
      ["Tour", "auto-advances through all 12 nodes"],
      ["Print", "reference sheet via browser print"]
    ]
  },
  da: {
    headerTitle: "Salgsordre-forløb",
    headerHint: 'Gå gennem listen med <kbd>↑</kbd> <kbd>↓</kbd> · <kbd>→</kbd> ind i det, der kan gå galt · <kbd>←</kbd> tilbage ud · eller start rundturen.',
    mapLabel: 'Forløb · gå med <kbd>↑</kbd><kbd>↓</kbd>',
    sidebarLabel: "Forløbskort: trin med undtagelsesstier",
    searchLabel: "Søg i forløbet",
    searchPlaceholder: "Søg i opgaver, roller, udfald…",
    startTour: "Start rundtur", stopTour: "Stop rundtur",
    themeLight: "Lys", themeNight: "Nat", themeContrast: "Kontrast",
    responsible: "Ansvarlig:",
    tasks: "Opgaver", outcomes: "Udfald",
    stageOf: "Trin {n} af {t}",
    branchOf: "Undtagelse til trin {n}",
    ifGoesWrong: "Hvis det går galt:",
    alsoUnder: "Også under trin {n}:",
    backToStage: "↩ Tilbage til trin {n}",
    orPress: "eller tryk ", goBackLeft: "tryk ", goBackRight: " for at gå tilbage",
    matchOne: "{n} match", matchMany: "{n} matches", matchNone: "ingen resultater",
    footText: "Involverede afdelinger: Salg · Finans · Lager · Produktion/KK · Logistik · Indkøb.<br>Nøgletal: ordregennemløbstid · leveringsprocent · leveringer til tiden · DSO · returrate.",
    backToStart: "Tilbage til start",
    groupOf: "Undtagelsesstier til trin {n}",
    prevNode: "Forrige punkt", nextNode: "Næste punkt",
    printTitle: "Salgsordre-forløb — referenceark",
    printSub: "Distributionsvirksomhed · hovedtrin 1-7, undtagelsesstier i grå nummerering (fx 2a)",
    helpTitle: "Genveje",
    helpRows: [
      ["<kbd>↑</kbd> <kbd>↓</kbd>", "forrige / næste synlige punkt (sammenlagte stier springes over)"],
      ["<kbd>→</kbd>", "udvid trinnets undtagelsesstier og åbn dem"],
      ["<kbd>←</kbd>", "tilbage til trinnet — dets undtagelsesstier foldes væk"],
      ["<kbd>Enter</kbd>", "åbn første søgeresultat"],
      ["<kbd>Esc</kbd>", "ryd søgning, luk hjælp, tilbage til start"],
      ["Rundtur", "kører automatisk gennem alle 12 punkter"],
      ["Udskriv", "referenceark via browserens udskrivning"]
    ]
  }
};

function str(key, vars) {
  let s = STR[LANG][key];
  if (vars) Object.keys(vars).forEach(k => { s = s.split("{" + k + "}").join(vars[k]); });
  return s;
}

const stages = NODES.map((n, i) => ({ n, i })).filter(x => x.n.kind === "stage");
const stageIndexByNum = {};
stages.forEach(x => { stageIndexByNum[x.n.num] = x.i; });

const branchesOf = num => NODES
  .map((n, i) => ({ n, i }))
  .filter(x => x.n.kind === "branch" && x.n.num.charAt(0) === num);

/* ---- collapsible exception groups ---- */
const COLLAPSED = new Set();
let branchGroups = {};

function applyGroupState(sNum) {
  const collapsed = COLLAPSED.has(sNum);
  if (branchGroups[sNum]) branchGroups[sNum].classList.toggle("collapsed", collapsed);
  const stageCard = document.querySelector('.stage-card[data-group="' + sNum + '"]');
  if (stageCard) {
    const caret = stageCard.querySelector(".caret");
    if (caret) caret.textContent = collapsed ? "▸" : "▾";
    if (stageCard.hasAttribute("aria-expanded")) stageCard.setAttribute("aria-expanded", String(!collapsed));
  }
}

function toggleGroup(sNum) {
  const collapsing = !COLLAPSED.has(sNum);
  if (collapsing) COLLAPSED.add(sNum); else COLLAPSED.delete(sNum);
  applyGroupState(sNum);
  // collapsing the group you are inside returns you to the stage
  if (collapsing && current >= 0) {
    const n = NODES[current];
    if (n.kind === "branch" && n.num.charAt(0) === sNum) openStep(stageIndexByNum[sNum]);
  }
}

/* going back to a stage folds its exception paths away with you */
function goBackToStage(num) {
  COLLAPSED.add(num);
  applyGroupState(num);
  openStep(stageIndexByNum[num]);
}

function expandGroup(sNum) {
  if (COLLAPSED.has(sNum)) { COLLAPSED.delete(sNum); applyGroupState(sNum); }
}

/* ---- sidebar map: stage treeitems, each with its exception-path group below.
   Rebuilt from scratch by applyLang so titles follow the active language.
   COLLAPSED persists across rebuilds; only the FIRST build starts groups hidden. ---- */
let groupsInitialized = false;

function buildSidebar() {
  branchGroups = {};
  sidebar.innerHTML = "";
  sidebar.setAttribute("aria-label", str("sidebarLabel"));

  const label = document.createElement("span");
  label.className = "maplabel";
  label.innerHTML = str("mapLabel");
  sidebar.appendChild(label);

  stages.forEach(x => {
    const sNum = x.n.num;
    const sTitle = L(x.n).title;
    const sDeptName = L(x.n).deptName;
    const branches = branchesOf(sNum);
    if (branches.length && !groupsInitialized) COLLAPSED.add(sNum);   // start hidden
    const card = document.createElement("div");
    card.className = "stage-card";
    card.dataset.index = x.i;
    card.dataset.group = sNum;
    card.tabIndex = 0;
    card.setAttribute("role", "treeitem");
    card.setAttribute("aria-level", "1");
    if (branches.length) card.setAttribute("aria-expanded", String(!COLLAPSED.has(sNum)));
    card.innerHTML =
      '<span class="caret' + (branches.length ? '' : ' empty') + '">' + (branches.length ? (COLLAPSED.has(sNum) ? "▸" : "▾") : "") + '</span>' +
      '<span class="num">' + sNum + '</span>' +
      '<h2>' + sTitle + '</h2>' +
      '<span class="dept-dot ' + x.n.dept + '" title="' + sDeptName + '"></span>';
    card.addEventListener("click", () => openStep(x.i));
    if (branches.length) {
      card.querySelector(".caret").addEventListener("click", e => { e.stopPropagation(); toggleGroup(sNum); });
    }
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openStep(x.i); }
    });
    sidebar.appendChild(card);

    if (branches.length) {
      const group = document.createElement("div");
      group.className = "bgroup" + (COLLAPSED.has(sNum) ? " collapsed" : "");
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", str("groupOf", { n: sNum }));
      branchGroups[sNum] = group;
      branches.forEach(b => {
        const bTitle = L(b.n).title;
        const bc = document.createElement("div");
        bc.className = "branch-card";
        bc.dataset.index = b.i;
        bc.tabIndex = 0;
        bc.setAttribute("role", "treeitem");
        bc.setAttribute("aria-level", "2");
        bc.innerHTML =
          '<span class="num">' + b.n.num + '</span>' +
          '<h3>' + bTitle + '</h3>' +
          '<span class="dept-dot ' + b.n.dept + '" title="' + L(b.n).deptName + '"></span>';
        bc.addEventListener("click", () => openStep(b.i));
        bc.addEventListener("keydown", e => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openStep(b.i); }
        });
        group.appendChild(bc);
      });
      sidebar.appendChild(group);
    }
  });
  groupsInitialized = true;
}
buildSidebar();

/* ---- progress rail: position within the 7-stage order-to-cash flow ---- */
const rail = document.getElementById("rail");
stages.forEach((x, pos) => {
  const notch = document.createElement("span");
  notch.className = "notch";
  notch.dataset.num = x.n.num;
  rail.appendChild(notch);
  if (pos < stages.length - 1) {
    const link = document.createElement("span");
    link.className = "rail-link";
    rail.appendChild(link);
  }
});
function updateRail(stageNum) {
  rail.querySelectorAll(".notch").forEach(el =>
    el.classList.toggle("active", el.dataset.num === stageNum));
}

/* ---- detail panel ---- */
function openStep(i, fromTour) {
  if (!fromTour) stopTour();
  current = i;
  const raw = NODES[i];
  const n = L(raw);
  const parent = raw.kind === "branch" ? raw.num.charAt(0) : null;

  if (parent !== null) expandGroup(parent);   // opening a branch reveals its group

  document.querySelectorAll(".stage-card, .branch-card").forEach(el => {
    el.classList.remove("active", "parentActive");
    el.removeAttribute("aria-current");
    const node = NODES[+el.dataset.index];
    if (+el.dataset.index === i) {
      el.classList.add("active");
      el.setAttribute("aria-current", "true");
    }
    else if (parent !== null && node.kind === "stage" && node.num === parent) el.classList.add("parentActive");
  });

  document.getElementById("d-badge").className = "badge " + raw.dept;
  document.getElementById("d-badge").textContent = n.deptName;
  document.getElementById("d-title").textContent = raw.num + ". " + n.title;
  document.getElementById("d-who").textContent = n.who;

  const tasks = document.getElementById("d-tasks");
  tasks.innerHTML = "";
  n.tasks.forEach(t => { const li = document.createElement("li"); li.textContent = t; tasks.appendChild(li); });

  const outcomes = document.getElementById("d-outcomes");
  outcomes.innerHTML = "";
  n.outcomes.forEach(o => {
    const li = document.createElement("li");
    const when = document.createElement("span");
    when.className = "when";
    when.textContent = o.when + " → ";
    li.appendChild(when);
    li.appendChild(document.createTextNode(o.then));
    outcomes.appendChild(li);
  });

  renderSubtoggle(i);

  document.getElementById("position").textContent = raw.kind === "stage"
    ? str("stageOf", { n: raw.num, t: stages.length })
    : str("branchOf", { n: parent });
  document.getElementById("prevBtn").disabled = i === 0;
  document.getElementById("nextBtn").disabled = i === NODES.length - 1;

  updateRail(parent !== null ? parent : raw.num);

  const activeCard = document.querySelector(".stage-card.active, .branch-card.active");
  if (activeCard) activeCard.scrollIntoView({ block: "nearest" });
}

function renderSubtoggle(i) {
  const raw = NODES[i];
  const box = document.getElementById("subtoggle");
  box.innerHTML = "";
  box.style.display = "none";

  if (raw.kind === "stage") {
    const branches = branchesOf(raw.num);
    if (!branches.length) return;
    box.style.display = "flex";
    const lab = document.createElement("span");
    lab.className = "lab";
    lab.textContent = str("ifGoesWrong");
    box.appendChild(lab);
    branches.forEach(x => box.appendChild(chip(x, false)));
    box.appendChild(keyHint(str("orPress"), "→", ""));
  } else {
    box.style.display = "flex";
    const parentNum = raw.num.charAt(0);
    const back = document.createElement("button");
    back.className = "chip back";
    back.textContent = str("backToStage", { n: parentNum });
    back.addEventListener("click", () => goBackToStage(parentNum));
    box.appendChild(back);
    const sibs = branchesOf(parentNum);
    if (sibs.length > 1) {
      const lab = document.createElement("span");
      lab.className = "lab";
      lab.textContent = str("alsoUnder", { n: parentNum });
      box.appendChild(lab);
      sibs.forEach(x => { if (x.i !== i) box.appendChild(chip(x, true)); });
    }
    box.appendChild(keyHint(str("goBackLeft"), "←", str("goBackRight")));
  }
}

function keyHint(before, key, after) {
  const hint = document.createElement("span");
  hint.className = "keyhint";
  hint.textContent = before;
  const kbd = document.createElement("kbd");
  kbd.textContent = key;
  hint.appendChild(kbd);
  if (after) hint.appendChild(document.createTextNode(after));
  return hint;
}

function chip(x, isOn) {
  const c = document.createElement("button");
  c.className = "chip" + (isOn ? " on" : "");
  c.textContent = x.n.num + " " + L(x.n).title;
  c.addEventListener("click", () => openStep(x.i));
  return c;
}

/* ---- list navigation (buttons + ↑/↓): walk only the VISIBLE nodes.
   Leaving a stage's territory in either direction folds its exception paths. ---- */
function foldGroup(num) {
  if (branchGroups[num] && !COLLAPSED.has(num)) { COLLAPSED.add(num); applyGroupState(num); }
}

function gotoNode(delta) {
  const visible = NODES
    .map((n, i) => ({ n, i }))
    .filter(x => x.n.kind === "stage" || !COLLAPSED.has(x.n.num.charAt(0)))
    .map(x => x.i);
  let pos = visible.indexOf(current);
  if (pos < 0 && current >= 0) {
    // current node was hidden (its group got collapsed under it): resume from its stage
    pos = visible.indexOf(stageIndexByNum[NODES[current].num.charAt(0)]);
  }
  const target = visible[Math.min(Math.max(pos + delta, 0), visible.length - 1)];
  const from = NODES[current];
  const to = NODES[target];
  openStep(target);
  if (from.kind === "branch") {
    // leaving the group unless hopping to a sibling path
    const sameGroup = to.kind === "branch" && to.num.charAt(0) === from.num.charAt(0);
    if (!sameGroup) foldGroup(from.num.charAt(0));
  } else if (to.kind === "stage" && to.num !== from.num) {
    foldGroup(from.num);
  }
}

/* ---- tree navigation (WAI tree view convention): → in, ← back out ---- */
function drill(delta) {
  if (current < 0) return;
  const n = NODES[current];
  if (delta === 1) {
    if (n.kind === "stage") {
      const branches = branchesOf(n.num);
      if (branches.length) {
        expandGroup(n.num);                     // → expands a closed group...
        openStep(branches[0].i);                 // ...and opens its first path
      }
    } else {
      const sibs = branchesOf(n.num.charAt(0));
      const pos = sibs.findIndex(x => x.n.num === n.num);
      if (pos < sibs.length - 1) openStep(sibs[pos + 1].i);   // → next sibling path
    }
  } else {
    if (n.kind === "branch") {
      goBackToStage(n.num.charAt(0));                          // ← back to the stage, paths fold away
    } else if (branchGroups[n.num] && !COLLAPSED.has(n.num)) {
      COLLAPSED.add(n.num);                                     // ← on the stage: collapse
      applyGroupState(n.num);
    }
  }
}

/* the main area always shows a node; "closing" means returning to stage 1 */
function goHome() {
  openStep(stages[0].i);
}

/* ---- tour mode: auto-advance through every node ---- */
let tourTimer = null;
let tourIdx = 0;
const TOUR_SECONDS = 4;

function startTour() {
  tourIdx = 0;
  openStep(0, true);
  tourBtn.textContent = str("stopTour");
  tourBtn.classList.add("on");
  tourTimer = setInterval(() => {
    tourIdx++;
    if (tourIdx >= NODES.length) { stopTour(); return; }
    openStep(tourIdx, true);
  }, TOUR_SECONDS * 1000);
}

function stopTour() {
  if (tourTimer === null) return;
  clearInterval(tourTimer);
  tourTimer = null;
  tourBtn.textContent = str("startTour");
  tourBtn.classList.remove("on");
}

tourBtn.addEventListener("click", () => { tourTimer === null ? startTour() : stopTour(); });

/* ---- keyboard ---- */
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if (!helpBox.hidden) { helpBox.hidden = true; return; }
    goHome();
    return;
  }
  if (e.target && e.target.tagName === "INPUT") return;   // don't hijack keys typed in the search box
  if (e.key === "ArrowDown") { e.preventDefault(); gotoNode(1); }
  if (e.key === "ArrowUp") { e.preventDefault(); gotoNode(-1); }
  if (e.key === "ArrowRight") { e.preventDefault(); drill(1); }
  if (e.key === "ArrowLeft") { e.preventDefault(); drill(-1); }
});

document.getElementById("prevBtn").addEventListener("click", () => gotoNode(-1));
document.getElementById("nextBtn").addEventListener("click", () => gotoNode(1));
document.getElementById("closeLink").addEventListener("click", goHome);

/* ---- shortcuts helper ---- */
const helpBtn = document.getElementById("helpBtn");
const helpBox = document.getElementById("helpBox");

helpBtn.addEventListener("click", () => { helpBox.hidden = !helpBox.hidden; });
document.addEventListener("mousedown", e => {
  if (!helpBox.hidden && !helpBox.contains(e.target) && e.target !== helpBtn) helpBox.hidden = true;
});

/* ---- search / filter ---- */
const searchBox = document.getElementById("searchBox");
const searchCount = document.getElementById("searchCount");

const searchTexts = n => {
  const v = L(n);
  return [v.title, v.who, v.deptName, ...v.tasks, ...v.outcomes.flatMap(o => [o.when, o.then])];
};

function applySearch() {
  const term = searchBox.value.trim().toLowerCase();
  const cards = document.querySelectorAll(".stage-card, .branch-card");
  if (!term) {
    cards.forEach(el => el.classList.remove("hit", "dim"));
    searchCount.textContent = "";
    return;
  }
  [...COLLAPSED].forEach(num => expandGroup(num));   // searching reveals collapsed groups
  let hits = 0;
  cards.forEach(el => {
    const raw = NODES[+el.dataset.index];
    const match = raw.num === term || searchTexts(raw).some(t => t.toLowerCase().includes(term));
    el.classList.toggle("hit", match);
    el.classList.toggle("dim", !match);
    if (match) hits++;
  });
  searchCount.textContent = hits
    ? str(hits === 1 ? "matchOne" : "matchMany", { n: hits })
    : str("matchNone");
}

searchBox.addEventListener("input", applySearch);

searchBox.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    e.stopPropagation();                     // Esc clears the search first, leave detail alone
    if (searchBox.value) {
      searchBox.value = "";
      applySearch();
    } else {
      searchBox.blur();
    }
  }
  if (e.key === "Enter") {
    const first = document.querySelector(".stage-card.hit, .branch-card.hit");
    if (first) openStep(+first.dataset.index);
  }
});

/* ---- theme switcher (light / night / high contrast) ---- */
const THEMES = ["", "night", "contrast"];
const themeBtns = document.querySelectorAll("#themes button");

function applyTheme(name) {
  document.body.classList.remove("theme-night", "theme-contrast");
  if (name) document.body.classList.add("theme-" + name);
  themeBtns.forEach(b => b.classList.toggle("on", b.dataset.theme === name));
  try { localStorage.setItem("wf-theme", name); } catch (err) { /* private mode */ }
}

themeBtns.forEach(b => b.addEventListener("click", () => applyTheme(b.dataset.theme)));

let savedTheme = "";
try { savedTheme = localStorage.getItem("wf-theme") || ""; } catch (err) { /* private mode */ }
applyTheme(THEMES.includes(savedTheme) ? savedTheme : "");

/* ---- print reference sheet: every node expanded, in the active language ---- */
function buildPrintDoc() {
  const doc = document.getElementById("printdoc");
  doc.innerHTML = "";
  const h1 = document.createElement("h1");
  h1.textContent = str("printTitle");
  const sub = document.createElement("p");
  sub.className = "sub";
  sub.textContent = str("printSub");
  doc.appendChild(h1); doc.appendChild(sub);

  NODES.forEach(raw => {
    const n = L(raw);
    const sec = document.createElement("section");
    const h2 = document.createElement("h2");
    h2.textContent = raw.num + ". " + n.title + "   (" + n.deptName + ")";
    const who = document.createElement("p");
    who.className = "p-who";
    who.textContent = str("responsible") + " " + n.who;
    sec.appendChild(h2); sec.appendChild(who);

    const tasks = document.createElement("ul");
    n.tasks.forEach(t => { const li = document.createElement("li"); li.textContent = t; tasks.appendChild(li); });
    sec.appendChild(tasks);

    const outs = document.createElement("ul");
    outs.className = "p-outcomes";
    n.outcomes.forEach(o => {
      const li = document.createElement("li");
      const when = document.createElement("span");
      when.className = "when";
      when.textContent = o.when + " → ";
      li.appendChild(when);
      li.appendChild(document.createTextNode(o.then));
      outs.appendChild(li);
    });
    sec.appendChild(outs);
    doc.appendChild(sec);
  });
}

/* ---- language switcher (english / dansk) ---- */
const LANGS = ["en", "da"];
const langBtns = document.querySelectorAll("#langs button");

function applyLang() {
  document.documentElement.lang = LANG === "da" ? "da" : "en";

  document.getElementById("headerTitle").textContent = str("headerTitle");
  document.getElementById("headerHint").innerHTML = str("headerHint");
  searchBox.placeholder = str("searchPlaceholder");
  searchBox.setAttribute("aria-label", str("searchLabel"));
  themeBtns.forEach(b => {
    b.textContent = b.dataset.theme === "" ? str("themeLight")
      : b.dataset.theme === "night" ? str("themeNight") : str("themeContrast");
  });
  tourBtn.textContent = tourTimer ? str("stopTour") : str("startTour");
  document.getElementById("prevBtn").setAttribute("aria-label", str("prevNode"));
  document.getElementById("nextBtn").setAttribute("aria-label", str("nextNode"));
  document.getElementById("footText").innerHTML = str("footText");
  document.getElementById("closeLink").textContent = str("backToStart");
  document.getElementById("d-responsible").textContent = str("responsible");
  document.getElementById("d-tasks-label").textContent = str("tasks");
  document.getElementById("d-outcomes-label").textContent = str("outcomes");
  document.getElementById("helpTitle").textContent = str("helpTitle");
  document.getElementById("helpTbody").innerHTML = STR[LANG].helpRows
    .map(r => "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td></tr>").join("");

  buildSidebar();
  buildPrintDoc();
  if (current >= 0) openStep(current, true);   // re-render the open node in the new language
  applySearch();
}

function setLang(lang) {
  if (!LANGS.includes(lang) || lang === LANG) return;
  LANG = lang;
  langBtns.forEach(b => b.classList.toggle("on", b.dataset.lang === LANG));
  try { localStorage.setItem("wf-lang", LANG); } catch (err) { /* private mode */ }
  applyLang();
}

langBtns.forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));

let savedLang = "en";
try { savedLang = localStorage.getItem("wf-lang") || "en"; } catch (err) { /* private mode */ }
LANG = LANGS.includes(savedLang) ? savedLang : "en";
langBtns.forEach(b => b.classList.toggle("on", b.dataset.lang === LANG));
document.documentElement.lang = LANG === "da" ? "da" : "en";
applyLang();

/* initial view: stage 1 — the main area always shows a node */
openStep(stages[0].i);
