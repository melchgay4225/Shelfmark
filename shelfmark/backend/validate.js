'use strict';
const GENRES = ['Fiction', 'Non-fiction', 'Sci-Fi', 'Fantasy', 'Mystery', 'History', 'Biography', 'Technology', 'Other'];
const STATUSES = ['want', 'reading', 'finished'];

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const int = (v) => (v === '' || v === null || v === undefined ? null : Number.parseInt(v, 10));

// Returns { value } or { errors }.
function validateBook(input = {}) {
  const errors = {};
  const out = {
    title: str(input.title, 160),
    author: str(input.author, 120),
    genre: str(input.genre, 40) || 'Other',
    status: str(input.status, 20) || 'want',
    isbn: str(input.isbn, 20),
    notes: str(input.notes, 1000),
    year: int(input.year),
    pages: int(input.pages),
    rating: int(input.rating) ?? 0,
  };
  if (!out.title) errors.title = 'Title is required.';
  if (!out.author) errors.author = 'Author is required.';
  if (!GENRES.includes(out.genre)) errors.genre = `Genre must be one of: ${GENRES.join(', ')}.`;
  if (!STATUSES.includes(out.status)) errors.status = 'Status must be want, reading or finished.';
  const thisYear = new Date().getFullYear();
  if (out.year !== null && !(out.year >= 1 && out.year <= thisYear + 1)) errors.year = 'Enter a valid year.';
  if (out.pages !== null && !(out.pages >= 1 && out.pages <= 10000)) errors.pages = 'Pages must be between 1 and 10000.';
  if (!(out.rating >= 0 && out.rating <= 5)) errors.rating = 'Rating must be 0 to 5.';
  return Object.keys(errors).length ? { errors } : { value: out };
}

module.exports = { validateBook, GENRES, STATUSES };
