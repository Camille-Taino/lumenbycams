# Lumen — daily devotion & journal (prototype)

A calm devotional web app: today's devotion, Bible search, a guide, a scrapbook
journal you can **type or handwrite** in, a prayer space and verse cards.
Plain HTML, CSS and JavaScript — no framework, no build step. Open it, edit it,
refresh.

---

## 1. Open it in Visual Studio Code

1. Unzip the folder somewhere easy, e.g. `C:\Users\<you>\source\lumen`.
2. In VS Code: **File → Open Folder…** and choose the `lumen` folder.
3. VS Code will suggest two extensions (from `.vscode/extensions.json`).
   Install **Live Server** — it's the only one you need.
4. Open `index.html`, then click **Go Live** in the blue status bar.
   The app opens in your browser at `http://127.0.0.1:5500`.
5. Edit any file and save: the browser reloads by itself.

> Prefer the terminal? With Node.js installed: `npm start`, then open
> `http://localhost:5173`.

## 2. What's in the folder

```
lumen/
├── index.html            ← page skeleton: nav rail, tab bar, <main> the screens draw into
├── css/styles.css        ← all styling; colours & fonts are tokens at the top
├── js/data.js            ← content: verses, guide notes, prompts, stickers, demo data
├── js/app.js             ← the app: screens, journal, handwriting, prayer, cards
├── manifest.webmanifest  ← makes it installable on a tablet/phone home screen
├── sw.js                 ← service worker: keeps it working offline
└── icons/                ← home-screen icons
```

### Where to make common changes

| I want to…                              | Go to |
|-----------------------------------------|-------|
| Change colours (Daylight / Candlelight) | `css/styles.css` → the three `:root` token blocks at the top. Change a value in **both** dark blocks. |
| Change fonts                            | `index.html` (Google Fonts link) and `--f-display`, `--f-ui`, `--f-hand` in `styles.css` |
| Add a verse to search                   | `js/data.js` → `V`. `tags` are the words/feelings that find it. |
| Change guide suggestions per feeling    | `js/data.js` → `FEEL` |
| Add journal prompts, stamps, washi      | `js/data.js` → `PROMPTS`, `STAMPS`, `WASHI` |
| Add a sticker                           | `js/data.js` → `STICKERS` (an inline SVG), then list its key in `dockSub()` in `app.js` |
| Change the demo content                 | `js/data.js` → `makeDemoState()` |
| Change a screen's layout                | `js/app.js` → `Today()`, `Bible()`, `Guide()`, `Journal()`, `Library()`, `Prayer()`, `Cards()`, `More()` |
| Change what a button does               | `js/app.js` → the click handler near the bottom (search for `data-` attribute names) |

### How the code fits together (quick tour)

- **State.** `S` holds everything a person saves. `persist()` writes it to
  `localStorage` (this device only). Journal edits call `save()`, which shows
  "Ink drying…" and then writes.
- **Screens are functions that return HTML.** `render()` puts the current
  screen into `<main>` and then wires up that screen's inputs.
- **One click handler for buttons.** Buttons carry `data-*` attributes
  (`data-go="bible"`, `data-tool="stickers"`, `data-add="sticker"`…) and a
  single listener decides what to do.
- **Journal.** Each page is an `<article class="page">` with three layers:
  the lined paper + text boxes, a `<canvas class="ink">` for handwriting,
  and a `.deco-layer` for stickers/notes/photos. `record()` saves a snapshot
  before every change so **Undo/Redo** cover strokes, decorations and pages.
  Pages grow by `GROW` pixels when you write near the bottom.

## 3. Try it on your tablet (same Wi-Fi, quickest)

1. Make sure the tablet and your computer are on the **same Wi-Fi**.
2. In VS Code click **Go Live**. Because of `.vscode/settings.json`, Live
   Server also listens on your network.
3. Find your computer's address: in a terminal run `ipconfig` and look for
   **IPv4 Address** (e.g. `192.168.1.24`).
4. On the tablet's browser open `http://192.168.1.24:5500`.

If it doesn't load, Windows Firewall is probably blocking it: allow
**Node.js / Code** on *Private networks* when Windows asks, or run
`npm run tablet` and use the "Network" address it prints.

Note: over plain `http://<ip>` the app works fully, but **offline mode and
"Install app" need https** — use option 4 for a proper demo install.

## 4. Put it online for demos (https, installable, works offline)

Any static host works. Two free, no-code options:

**Netlify Drop (2 minutes)**
1. Go to <https://app.netlify.com/drop> and sign in.
2. Drag the whole `lumen` folder onto the page.
3. You get an https link like `https://lumen-demo.netlify.app`. Open it on the tablet.
4. To update later: drag the folder again onto the same site's *Deploys* tab.

**GitHub Pages**
1. Create a repository and push this folder (VS Code's Source Control panel can do this).
2. Repository **Settings → Pages → Deploy from branch → main / root**.
3. Your link: `https://<username>.github.io/<repo>/`.

Check with your IT team before hosting it on a personal account if the demo
is for work.

### Install it on the tablet like an app

- **iPad (Safari):** open the link → Share button → **Add to Home Screen**.
- **Android tablet (Chrome):** open the link → ⋮ menu → **Install app** (or *Add to Home screen*).

It opens full-screen with the candle icon and keeps working without internet
after the first visit.

## 5. Demo tips

- **More → Reset demo content** puts back the example pages and prayers
  (tap twice to confirm). Do this before each demo.
- Handwriting works best with a stylus. A resting palm is ignored once a
  stylus has been used. Two fingers scroll the page while handwriting.
- **More → Candlelight** shows the evening look; **Larger text** shows the
  accessibility setting.
- Everything is saved on that tablet only. Clearing the browser's site data
  erases it.

## 6. When you change files after installing

The service worker serves the latest files when online, but if a tablet
looks stale: open `sw.js`, change `VERSION` (e.g. `lumen-v2`), redeploy, then
close and reopen the app on the tablet.

## 7. Known limits of this prototype

- No accounts or sync: journals live on one device.
- The guide uses fixed sample notes in `data.js` (not live AI).
- Verse cards can't be downloaded as images yet (take a screenshot).
- Bible text is the KJV (public domain) and limited to the verses in `data.js`.
