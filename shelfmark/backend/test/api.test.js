'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { createApp } = require('../server');

let server, base;
test.before(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shelfmark-'));
  const app = createApp({ dataFile: path.join(dir, 'books.json') });
  await new Promise((r) => (server = app.listen(0, r)));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
test.after(() => server.close());

const json = (url, opts = {}) =>
  fetch(base + url, { headers: { 'Content-Type': 'application/json' }, ...opts }).then(async (r) => ({
    status: r.status,
    body: r.status === 204 ? null : await r.json(),
  }));

test('health check', async () => {
  const r = await json('/health');
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
});

test('lists seeded books and filters/searches', async () => {
  const all = await json('/books');
  assert.ok(all.body.length >= 10);
  const fin = await json('/books?status=finished');
  assert.ok(fin.body.every((b) => b.status === 'finished'));
  const q = await json('/books?q=dune');
  assert.equal(q.body[0].title, 'Dune');
});

test('create, update, delete lifecycle', async () => {
  const created = await json('/books', {
    method: 'POST',
    body: JSON.stringify({ title: 'Test Book', author: 'Tester', genre: 'Fiction', status: 'reading', pages: 100 }),
  });
  assert.equal(created.status, 201);
  const id = created.body.id;

  const updated = await json('/books/' + id, {
    method: 'PUT',
    body: JSON.stringify({ title: 'Test Book 2', author: 'Tester', status: 'finished', rating: 4 }),
  });
  assert.equal(updated.body.title, 'Test Book 2');
  assert.equal(updated.body.status, 'finished');

  assert.equal((await json('/books/' + id, { method: 'DELETE' })).status, 204);
  assert.equal((await json('/books/' + id)).status, 404);
});

test('rejects invalid input with field errors', async () => {
  const r = await json('/books', { method: 'POST', body: JSON.stringify({ title: '', author: '', rating: 9 }) });
  assert.equal(r.status, 400);
  assert.ok(r.body.fields.title && r.body.fields.author && r.body.fields.rating);
});

test('stats reflect the data', async () => {
  const s = await json('/stats');
  assert.equal(typeof s.body.total, 'number');
  assert.ok(s.body.finished >= 1);
});
