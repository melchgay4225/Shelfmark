// Shelfmark front end - vanilla JS, no build step.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const GENRES = {
  Fiction: '#2F5DA8', 'Non-fiction': '#4F7A3D', 'Sci-Fi': '#5B4B9A', Fantasy: '#7A3E65', Mystery: '#3E4A63',
  History: '#8A5A12', Biography: '#9B3D2E', Technology: '#1F6F78', Other: '#666E75',
};
const STATUS = { want: 'Want to read', reading: 'Reading', finished: 'Finished' };
const SORTS = {
  recent: (a, b) => b.createdAt.localeCompare(a.createdAt),
  title: (a, b) => a.title.localeCompare(b.title),
  author: (a, b) => a.author.localeCompare(b.author),
  rating: (a, b) => b.rating - a.rating || a.title.localeCompare(b.title),
  year: (a, b) => (b.year || 0) - (a.year || 0),
};

/* ---------- Element helper (builds DOM safely, no innerHTML with user data) ---------- */
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...kids.flat().filter((k) => k != null && k !== false));
  return el;
}

/* ---------- Data layer: REST API when available, localStorage demo otherwise ---------- */
const Api = {
  mode: 'demo',
  base: ((window.APP_CONFIG || {}).API_BASE || '').replace(/\/$/, ''),

  async init() {
    try {
      const res = await this.raw('/api/health', {}, 4000);
      const body = await res.json();
      if (res.ok && body.ok) this.mode = 'live';
    } catch { /* fall through to demo mode */ }
    if (this.mode === 'demo') await Local.init();
    return this.mode;
  },

  async raw(path, opts = {}, timeout = 10000) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeout);
    try {
      return await fetch(this.base + path, {
        ...opts, signal: ctl.signal, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      });
    } finally { clearTimeout(t); }
  },

  async call(path, opts) {
    const res = await this.raw(path, opts);
    if (res.status === 204) return null;
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(body.error || 'Request failed.'), { fields: body.fields });
    return body;
  },

  list: (f) => (Api.mode === 'live'
    ? Api.call('/api/books?' + new URLSearchParams(Object.entries(f).filter(([, v]) => v)))
    : Local.list(f)),
  stats: () => (Api.mode === 'live' ? Api.call('/api/stats') : Local.stats()),
  save: (book, id) => (Api.mode === 'live'
    ? Api.call(id ? `/api/books/${id}` : '/api/books', { method: id ? 'PUT' : 'POST', body: JSON.stringify(book) })
    : Local.save(book, id)),
  remove: (id) => (Api.mode === 'live' ? Api.call(`/api/books/${id}`, { method: 'DELETE' }) : Local.remove(id)),
};

const Local = {
  key: 'shelfmark.books.v1', books: [],
  async init() {
    try { this.books = JSON.parse(localStorage.getItem(this.key)); } catch { /* ignore */ }
    if (!Array.isArray(this.books)) {
      this.books = await (await fetch('js/seed.json')).json();
      this.persist();
    }
  },
  persist() { try { localStorage.setItem(this.key, JSON.stringify(this.books)); } catch { /* storage full or blocked */ } },
  async list({ q = '', status = '', genre = '', sort = 'recent' }) {
    const n = q.trim().toLowerCase();
    return this.books
      .filter((b) => (!status || b.status === status) && (!genre || b.genre === genre))
      .filter((b) => !n || [b.title, b.author, b.isbn, b.notes].some((f) => (f || '').toLowerCase().includes(n)))
      .sort(SORTS[sort] || SORTS.recent);
  },
  async stats() {
    const fin = this.books.filter((b) => b.status === 'finished');
    const rated = this.books.filter((b) => b.rating > 0);
    return {
      total: this.books.length, finished: fin.length,
      reading: this.books.filter((b) => b.status === 'reading').length,
      want: this.books.filter((b) => b.status === 'want').length,
      pagesRead: fin.reduce((n, b) => n + (b.pages || 0), 0),
      avgRating: rated.length ? Math.round((rated.reduce((n, b) => n + b.rating, 0) / rated.length) * 10) / 10 : 0,
    };
  },
  async save(data, id) {
    const fields = {};
    if (!data.title) fields.title = 'Title is required.';
    if (!data.author) fields.author = 'Author is required.';
    if (Object.keys(fields).length) throw Object.assign(new Error('Check the highlighted fields.'), { fields });
    const now = new Date().toISOString();
    if (id) {
      const i = this.books.findIndex((b) => b.id === id);
      this.books[i] = { ...this.books[i], ...data, updatedAt: now };
      this.persist();
      return this.books[i];
    }
    const book = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now };
    this.books.push(book);
    this.persist();
    return book;
  },
  async remove(id) { this.books = this.books.filter((b) => b.id !== id); this.persist(); },
};

/* ---------- State & rendering ---------- */
const state = { books: [], view: 'shelf', editing: null, filters: { q: '', status: '', genre: '', sort: 'recent' } };
const stars = (n) => (n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '');

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('show'), 2600);
}

async function refresh() {
  try {
    const [books, stats] = await Promise.all([Api.list(state.filters), Api.stats()]);
    state.books = books;
    renderSummary(stats);
    render();
  } catch (e) {
    toast('Could not load books. Check your connection and try again.');
  }
}

function renderSummary(s) {
  $('#summary').textContent = s.total
    ? `${s.total} ${s.total === 1 ? 'book' : 'books'} on your shelves, ${s.finished} finished.`
    : 'Your shelves are empty. Add your first book.';
  const fig = (label, value) => h('div', {}, h('dt', {}, label), h('dd', {}, String(value)));
  $('#figures').replaceChildren(
    fig('Reading now', s.reading), fig('Pages finished', s.pagesRead.toLocaleString()),
    fig('Average rating', s.avgRating ? s.avgRating.toFixed(1) : 'None yet'),
  );
}

function render() {
  const empty = !state.books.length;
  $('#empty').hidden = !empty;
  $('#shelf').hidden = state.view !== 'shelf' || empty;
  $('#list').hidden = state.view !== 'list' || empty;
  if (empty) return;
  if (state.view === 'shelf') renderShelf(); else renderList();
}

function spine(b) {
  const pages = b.pages || 250;
  const w = Math.max(38, Math.min(68, Math.round(26 + pages / 12)));
  const hgt = Math.max(225, Math.min(275, Math.round(185 + pages / 8)));
  return h('button', {
    type: 'button', class: `spine ${b.status}`, style: `--c:${GENRES[b.genre] || GENRES.Other};width:${w}px;height:${hgt}px`,
    'aria-label': `${b.title} by ${b.author}. ${STATUS[b.status]}.${b.rating ? ` Rated ${b.rating} of 5.` : ''} Open to edit.`,
    title: `${b.title} - ${b.author}`, 'data-w': w, onclick: () => openDialog(b),
  }, b.status === 'finished' ? h('span', { class: 'band' }) : null,
  h('span', { class: 't' }, b.title), h('span', { class: 'a' }, b.author));
}

function renderShelf() {
  const shelf = $('#shelf');
  const avail = shelf.clientWidth - 28;
  const rows = [[]];
  let used = 0;
  for (const b of state.books) {
    const el = spine(b);
    const w = +el.dataset.w + 5;
    if (used + w > avail && rows.at(-1).length) { rows.push([]); used = 0; }
    rows.at(-1).push(el);
    used += w;
  }
  shelf.replaceChildren(...rows.map((r) => h('div', { class: 'row' }, r)));
}

function renderList() {
  $('#rows').replaceChildren(...state.books.map((b) => h('tr', {},
    h('td', { class: 'title' }, b.title), h('td', {}, b.author), h('td', {}, b.genre),
    h('td', {}, h('span', { class: `chip ${b.status}` }, STATUS[b.status])),
    h('td', {}, h('span', { class: 'stars', 'aria-label': b.rating ? `${b.rating} of 5` : 'Not rated' }, stars(b.rating))),
    h('td', {}, h('button', { type: 'button', class: 'btn', onclick: () => openDialog(b) }, 'Edit')),
  )));
}

/* ---------- Dialog (add / edit / delete) ---------- */
const dlg = $('#dlg');
const form = $('#form');

function openDialog(book = null) {
  state.editing = book;
  form.reset();
  clearErrors();
  $('#dlgTitle').textContent = book ? 'Edit book' : 'Add book';
  $('#del').hidden = !book;
  resetDelete();
  for (const el of form.elements) {
    if (el.name) el.value = book && book[el.name] != null ? book[el.name] : (el.name === 'rating' ? '0' : el.name === 'status' ? 'want' : '');
  }
  if (!book) form.elements.genre.value = 'Fiction';
  dlg.showModal();
  form.elements.title.focus();
}

function clearErrors() {
  $$('.err', form).forEach((e) => (e.textContent = ''));
  $$('[aria-invalid]', form).forEach((e) => e.removeAttribute('aria-invalid'));
}
function showErrors(fields = {}, msg = '') {
  clearErrors();
  for (const [name, text] of Object.entries(fields)) {
    const out = $(`.err[data-for="${name}"]`, form);
    if (out) out.textContent = text;
    form.elements[name]?.setAttribute('aria-invalid', 'true');
  }
  $('#formError').textContent = msg;
  const first = form.querySelector('[aria-invalid]');
  if (first) first.focus();
}

function resetDelete() {
  const d = $('#del');
  d.classList.remove('confirm');
  d.textContent = 'Delete book';
  d.dataset.armed = '';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const fields = {};
  if (!data.title.trim()) fields.title = 'Enter a title.';
  if (!data.author.trim()) fields.author = 'Enter an author.';
  if (Object.keys(fields).length) return showErrors(fields);
  data.rating = +data.rating;
  data.year = data.year ? +data.year : null;
  data.pages = data.pages ? +data.pages : null;
  data.title = data.title.trim(); data.author = data.author.trim();
  const btn = $('#save');
  btn.disabled = true;
  try {
    const wasEdit = !!state.editing;
    await Api.save(data, state.editing?.id);
    dlg.close();
    toast(wasEdit ? 'Book saved.' : 'Book added.');
    await refresh();
  } catch (err) {
    showErrors(err.fields, err.fields ? '' : err.message);
  } finally { btn.disabled = false; }
});

$('#del').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  if (!btn.dataset.armed) { // first click asks for confirmation
    btn.dataset.armed = '1';
    btn.classList.add('confirm');
    btn.textContent = 'Confirm delete';
    return;
  }
  try {
    await Api.remove(state.editing.id);
    dlg.close();
    toast('Book deleted.');
    await refresh();
  } catch (err) { showErrors({}, err.message); }
});

$('#cancel').addEventListener('click', () => dlg.close());
dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); // click on backdrop

/* ---------- Controls ---------- */
$('#add').addEventListener('click', () => openDialog());

let debounce;
$('#q').addEventListener('input', (e) => {
  clearTimeout(debounce);
  debounce = setTimeout(() => { state.filters.q = e.target.value; refresh(); }, 200);
});
$('#genre').addEventListener('change', (e) => { state.filters.genre = e.target.value; refresh(); });
$('#sort').addEventListener('change', (e) => { state.filters.sort = e.target.value; refresh(); });

$$('.tabs button').forEach((b) => b.addEventListener('click', () => {
  $$('.tabs button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  state.filters.status = b.dataset.status;
  refresh();
}));
$$('.seg button').forEach((b) => b.addEventListener('click', () => {
  $$('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  state.view = b.dataset.view;
  render();
}));

let resizeT, lastW = 0;
new ResizeObserver(() => {
  const w = $('#shelf').clientWidth;
  if (w === lastW) return;
  lastW = w;
  clearTimeout(resizeT);
  resizeT = setTimeout(() => state.view === 'shelf' && !$('#shelf').hidden && renderShelf(), 120);
}).observe($('#shelf'));

/* ---------- Boot ---------- */
(async function boot() {
  const genreOpts = Object.keys(GENRES);
  $('#genre').append(...genreOpts.map((g) => h('option', { value: g }, g)));
  $('#f-genre').append(...genreOpts.map((g) => h('option', { value: g }, g)));
  $('#legend').append(...genreOpts.map((g) => h('li', { style: `--c:${GENRES[g]}` }, g)));

  const mode = await Api.init();
  const m = $('#mode');
  m.className = `mode ${mode === 'live' ? 'live' : 'demo'}`;
  m.textContent = mode === 'live' ? 'Connected to server' : 'Demo mode: saved in this browser only';
  await refresh();
})();
