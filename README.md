# Shelfmark – Book Management System

A full-stack web app for cataloguing books and tracking what you are reading. Books appear as spines on a shelf (width and height follow page count, colour follows genre), with a list view for a plainer table.

- **Frontend:** HTML, CSS and vanilla JavaScript (no build step, about 10 KB gzipped on first load)
- **Backend:** Node.js and Express REST API with JSON-file storage
- **Features:** add, edit and delete books; search by title, author or ISBN; filter by status and genre; sort; reading statistics; validation on both client and server
- **Demo mode:** if no API is reachable (for example on GitHub Pages without a backend), the app stores data in the browser's localStorage so it still works

## Project structure

```
shelfmark/
├── backend/            Express API (+ serves ../frontend)
│   ├── server.js       routes, gzip, caching headers
│   ├── store.js        JSON-file persistence
│   ├── validate.js     input validation
│   ├── query.js        search / filter / sort / stats
│   ├── data/seed.json  starter books
│   └── test/           API tests (node:test)
├── frontend/           static site
│   ├── index.html
│   ├── css/styles.css
│   └── js/ app.js, config.js, seed.json
├── docs/
│   ├── DEPLOYMENT_RECORD.md   Task 1 – fill in after deploying
│   └── PERFORMANCE_REPORT.md  Task 2 – Lighthouse / PageSpeed worksheet
├── .github/workflows/  GitHub Pages deploy + CI tests
└── render.yaml         one-click backend deploy on Render
```

## Run locally

```bash
cd backend
npm install
npm start          # http://localhost:3000  (API at /api, frontend served from ../frontend)
npm test           # 5 API tests
```

## API

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/books?q=&status=&genre=&sort=` | List books. `status`: want, reading, finished. `sort`: recent, title, author, rating, year |
| GET | `/api/books/:id` | One book |
| POST | `/api/books` | Create (title and author required) |
| PUT | `/api/books/:id` | Update |
| DELETE | `/api/books/:id` | Delete |
| GET | `/api/stats` | Totals, pages finished, average rating |

## Deploy

Pick one. Option A is the simplest and gives a fully working app (shared data on a server).

### Option A – Everything on Render (frontend + backend, one URL)

1. Push this folder to a GitHub repository.
2. On [render.com](https://render.com): **New → Blueprint**, select the repo. Render reads `render.yaml`.
3. When the build finishes you get `https://shelfmark-xxxx.onrender.com`.

Notes: the free plan sleeps after inactivity (the first request can take about 30–60 seconds), and its disk is not persistent, so books you add reset when the service restarts. For permanent storage, attach a Render disk or swap `store.js` for a database.

### Option B – Frontend on GitHub Pages, backend on Render

1. Deploy the backend with Option A and copy its URL.
2. Edit `frontend/js/config.js`: `window.APP_CONFIG = { API_BASE: "https://shelfmark-xxxx.onrender.com" };`
3. In Render, set `CORS_ORIGIN` to `https://YOUR-USERNAME.github.io`.
4. Push to GitHub, then **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. The `Deploy frontend to GitHub Pages` workflow publishes `frontend/` at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

### Option C – GitHub Pages only (demo mode)

Do steps 4–5 of Option B and leave `API_BASE` empty. The header shows "Demo mode: saved in this browser only". Good for a quick showcase, but data is not shared between visitors.

## After deploying

1. Fill in `docs/DEPLOYMENT_RECORD.md` (Task 1).
2. Run PageSpeed Insights or Lighthouse and fill in `docs/PERFORMANCE_REPORT.md` (Task 2).
