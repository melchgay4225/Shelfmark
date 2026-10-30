'use strict';
// Tiny JSON-file persistence layer. Writes are atomic (temp file + rename).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createStore(file, seedFile) {
  let books = [];

  function load() {
    try {
      books = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      books = seedFile && fs.existsSync(seedFile) ? JSON.parse(fs.readFileSync(seedFile, 'utf8')) : [];
      persist();
    }
  }

  function persist() {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(books, null, 1));
    fs.renameSync(tmp, file);
  }

  load();

  return {
    all: () => books,
    get: (id) => books.find((b) => b.id === id),
    create(data) {
      const now = new Date().toISOString();
      const book = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now };
      books.push(book);
      persist();
      return book;
    },
    update(id, data) {
      const i = books.findIndex((b) => b.id === id);
      if (i < 0) return null;
      books[i] = { ...books[i], ...data, id, updatedAt: new Date().toISOString() };
      persist();
      return books[i];
    },
    remove(id) {
      const i = books.findIndex((b) => b.id === id);
      if (i < 0) return false;
      books.splice(i, 1);
      persist();
      return true;
    },
  };
}

module.exports = { createStore };
