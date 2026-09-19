# Lee Boon Yew — Portfolio

Personal portfolio of Lee Boon Yew, a Computer Science student at TAR UMT (Malaysia).
Static HTML/CSS/JS — no framework, no build step — deployed on GitHub Pages.

## Concept: the site is a code editor

Each section is a **file** you open by scrolling, and the editor chrome stays fixed around it:

| File | What it shows |
|---|---|
| `README.md` | Hero — the name types itself in, rotating role, photo in an image-viewer pane, a summary as a JS object |
| `about.kt` | A short bio next to the same facts written as a Kotlin `data class`, plus key stats |
| `skills.json` | A draggable force-directed **dependency graph** of languages, mobile, data and tools |
| `journey.git` | Experience and education as a **git graph** that draws itself as you scroll (work and education are branches merging into `HEAD`) |
| `projects/` | Split view: repository list + a sticky preview that follows the scroll (inline screenshots on phones) |
| `achievements.test` | Achievements printed as a passing test run |
| `contact.sh` | A working **terminal** (`help`, `projects`, `email`, `resume`, `hire`…) plus plain links |

Around it: title bar, activity bar, file explorer (a drawer on phones), tabs and breadcrumbs that follow
the scroll, a minimap, a live status bar (current file language, line number, availability) and a
**Ctrl/⌘ + K command palette**.

**Design rules:** one typeface family (Geist + Geist Mono) with extreme size contrast, a near-black
palette with a single amber accent (syntax colours only inside code), and motion that is tied to
scrolling rather than autoplaying. `prefers-reduced-motion` turns the motion off.

## Structure

```
.
├── index.html            # All content (edit text here)
├── styles.css            # All styles — tokens at the top
├── js/
│   ├── ide.js            # Chrome: explorer, scroll-spy, gutters, minimap, reveals, hero typing, command palette
│   ├── gitlog.js         # journey.git graph
│   ├── skills-graph.js   # skills.json dependency graph (canvas)
│   ├── projects.js       # projects/ split view
│   └── terminal.js       # contact.sh terminal
├── images/               # Profile photo and project screenshots
└── resume/               # Resume PDF
```

## Running locally

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Customising

- **Colours / fonts:** the `:root` tokens at the top of `styles.css` (`--accent` is the one accent).
- **Skills:** the `<li data-group="…">` items in `#skill-list` — the graph is built from them.
- **Journey:** the `<li class="commit" data-lane="…">` items (lane 1 = education, 2 = work).
- **Projects:** the `<li class="repo">` items — `data-img` and `data-url` drive the preview.
- **Terminal commands:** the `commands` object in `js/terminal.js`.

## Dependencies (CDN only)

- Google Fonts (Geist, Geist Mono), Font Awesome 6
- [canvas-confetti](https://github.com/catdad/canvas-confetti) — loaded only when you type `hire`
