'use strict';
const path = require('path');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { createStore } = require('./store');
const { validateBook, GENRES, STATUSES } = require('./validate');
const { queryBooks, computeStats } = require('./query');

function createApp({ dataFile, seedFile, frontendDir } = {}) {
  const store = createStore(
    dataFile || process.env.DATA_FILE || path.join(__dirname, 'data', 'books.json'),
    seedFile || path.join(__dirname, 'data', 'seed.json')
  );
  const app = express();

  app.disable('x-powered-by');
  app.use(compression()); // gzip responses (Lighthouse: "Enable text compression")
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
  app.use(express.json({ limit: '50kb' }));

  // ---- API ----
  const api = express.Router();
  api.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  api.get('/health', (req, res) => res.json({ ok: true, name: 'shelfmark', time: new Date().toISOString() }));
  api.get('/meta', (req, res) => res.json({ genres: GENRES, statuses: STATUSES }));
  api.get('/stats', (req, res) => res.json(computeStats(store.all())));

  api.get('/books', (req, res) => res.json(queryBooks(store.all(), req.query)));

  api.get('/books/:id', (req, res) => {
    const book = store.get(req.params.id);
    return book ? res.json(book) : res.status(404).json({ error: 'Book not found.' });
  });

  api.post('/books', (req, res) => {
    const { value, errors } = validateBook(req.body);
    if (errors) return res.status(400).json({ error: 'Check the highlighted fields.', fields: errors });
    return res.status(201).json(store.create(value));
  });

  api.put('/books/:id', (req, res) => {
    const { value, errors } = validateBook(req.body);
    if (errors) return res.status(400).json({ error: 'Check the highlighted fields.', fields: errors });
    const book = store.update(req.params.id, value);
    return book ? res.json(book) : res.status(404).json({ error: 'Book not found.' });
  });

  api.delete('/books/:id', (req, res) =>
    store.remove(req.params.id) ? res.status(204).end() : res.status(404).json({ error: 'Book not found.' })
  );

  api.use((req, res) => res.status(404).json({ error: 'Unknown API route.' }));
  app.use('/api', api);

  // ---- Static frontend (optional single-server deployment) ----
  const staticDir = frontendDir || path.join(__dirname, '..', 'frontend');
  app.use(
    express.static(staticDir, {
      maxAge: '7d', // long-lived caching for assets
      setHeaders(res, file) {
        if (file.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
      },
    })
  );

  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  });

  return app;
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createApp().listen(port, () => console.log(`Shelfmark running at http://localhost:${port}`));
}

module.exports = { createApp };
