'use strict';
// Search, filter and sort - kept free of Express so it is easy to test.
const SORTS = {
  recent: (a, b) => b.createdAt.localeCompare(a.createdAt),
  title: (a, b) => a.title.localeCompare(b.title),
  author: (a, b) => a.author.localeCompare(b.author),
  rating: (a, b) => b.rating - a.rating || a.title.localeCompare(b.title),
  year: (a, b) => (b.year || 0) - (a.year || 0),
};

function queryBooks(books, { q = '', status = '', genre = '', sort = 'recent' } = {}) {
  const needle = String(q).trim().toLowerCase();
  return books
    .filter((b) => !status || b.status === status)
    .filter((b) => !genre || b.genre === genre)
    .filter((b) => !needle || [b.title, b.author, b.isbn, b.notes].some((f) => (f || '').toLowerCase().includes(needle)))
    .sort(SORTS[sort] || SORTS.recent);
}

function computeStats(books) {
  const finished = books.filter((b) => b.status === 'finished');
  const rated = books.filter((b) => b.rating > 0);
  const genres = {};
  books.forEach((b) => (genres[b.genre] = (genres[b.genre] || 0) + 1));
  return {
    total: books.length,
    want: books.filter((b) => b.status === 'want').length,
    reading: books.filter((b) => b.status === 'reading').length,
    finished: finished.length,
    pagesRead: finished.reduce((n, b) => n + (b.pages || 0), 0),
    avgRating: rated.length ? Math.round((rated.reduce((n, b) => n + b.rating, 0) / rated.length) * 10) / 10 : 0,
    genres,
  };
}

module.exports = { queryBooks, computeStats };
