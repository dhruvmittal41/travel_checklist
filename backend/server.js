// server.js
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

let db;

(async () => {
  db = await open({
    filename: './checklist.db',
    driver: sqlite3.Database,
  });

  // Initialize DB tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      category_id INTEGER NOT NULL,
      added_by TEXT,
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );
  `);
})();

// Get all categories
app.get('/api/categories', async (req, res) => {
  const categories = await db.all('SELECT * FROM categories');
  res.json(categories);
});

// Add a new category
app.post('/api/categories', async (req, res) => {
  const { name } = req.body;
  const result = await db.run('INSERT INTO categories (name) VALUES (?)', [name]);
  res.status(201).json({ id: result.lastID, name });
});

// Get items in a category
app.get('/api/items/:category_id', async (req, res) => {
  const items = await db.all(
    'SELECT * FROM items WHERE category_id = ?',
    req.params.category_id
  );
  res.json(items);
});

// Add a new item
app.post('/api/items', async (req, res) => {
  const { name, completed = false, category_id, added_by } = req.body;
  try {
    const result = await db.run(
      'INSERT INTO items (name, completed, category_id, added_by) VALUES (?, ?, ?, ?)',
      name,
      completed ? 1 : 0,
      category_id,
      added_by || null
    );
    res.status(201).json({ id: result.lastID });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding item');
  }
});

// Update item completion
app.put('/api/items/:id', async (req, res) => {
  const { completed } = req.body;
  await db.run('UPDATE items SET completed = ? WHERE id = ?', completed ? 1 : 0, req.params.id);
  res.sendStatus(200);
});

// Delete item
app.delete('/api/items/:id', async (req, res) => {
  await db.run('DELETE FROM items WHERE id = ?', req.params.id);
  res.sendStatus(200);
});

// Delete category
app.delete('/api/categories/:id', async (req, res) => {
  await db.run('DELETE FROM categories WHERE id = ?', req.params.id);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



import path from 'path';
import { fileURLToPath } from 'url';

// Enable ES Modules' __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'client', 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});
