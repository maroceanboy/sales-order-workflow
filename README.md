# Sales Order Workflow — From Order to Cash

An interactive training artifact for the **order-to-cash (O2C) process** in a distribution
business: 7 main stages from order receipt to order closure, plus 5 explicit exception
paths (credit hold, shortage/backorder, transit damage, returns/RMA, collections).

Built as plain HTML, CSS and JavaScript — no frameworks, no build step, no dependencies.

## What it does

- **Workflow map** — sidebar with all stages and their exception paths, collapsible
  tree following the WAI ARIA tree view pattern (arrows: walk the list, drill in, fold back)
- **Node detail** — responsible role, tasks, and outcomes per stage, with exception
  paths right under them ("If it goes wrong")
- **Examples of what happens when things go wrong** — typed scenarios for credit
  hold, backorders, carrier claims, returns and late payment
- **Training niceties** — auto-advancing tour mode, keyboard shortcuts helper,
  search across tasks/roles/outcomes, print-ready reference sheet
- **Three themes** — light, night (dark brown/orange), high contrast
- **English and Danish** — full content translation, persisted per visitor
- **Automated integrity test** — `node test.js` validates content, structure,
  translations and theming

## Files

| File | Purpose |
|---|---|
| `workflow.html` | Thin shell: markup only |
| `style.css` | All styling; 3 themes via CSS variables |
| `data.js` | Workflow content (English): 12 nodes |
| `data-da.js` | Danish translation of the same content |
| `app.js` | Rendering, navigation, tour, search, i18n |
| `test.js` | Data/structure integrity test (`node test.js`) |

## Running it

The files must stay together — open `workflow.html` directly in a browser, or serve
the folder (e.g. `npx serve` or `python -m http.server`) and visit it.

Run the test suite:

```bash
node test.js
```

## Content model

Each workflow node has a number (`1`–`7` for stages, `2a`/`3a`/`5a`/`5b`/`6a` for
exception paths), a department, a responsible role, tasks and outcomes. Every outcome
names its condition and consequence, and exception paths re-join the main flow
explicitly. The test suite enforces: complete fields, branches attach to real stages,
sequential numbering, both languages complete, every department has colors defined.

## Try it

The workflow runs live at: `https://<your-github-username>.github.io/sales-order-workflow/`

(activated after enabling GitHub Pages — see below)

## License & usage

This project is published **for viewing and trying only**, as a working example of a
sales-order training artifact. All rights reserved. Content and code may not be
modified, copied into other projects, or redistributed without the author's permission.

## GitHub Pages hosting

1. Push this repository to GitHub (branch `main`)
2. Repository → **Settings** → **Pages**
3. Source: **Deploy from a branch** — Branch: `main` / folder `/ (root)` — **Save**
4. In a few minutes the live site is available under
   `https://<your-github-username>.github.io/sales-order-workflow/`
