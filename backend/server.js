// server.js
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express and HTTP Server
const app = express();
const httpServer = createServer(app);

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Setup Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Broadcast update to all clients
const broadcastUpdate = () => io.emit('update');

// Initialize SQLite database
let db;
const initDb = async () => {
  db = await open({
    filename: './checklist.db',
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      completed INTEGER,
      category_id INTEGER,
      added_by TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);
};

// API Endpoints

// Get all categories
app.get('/api/categories', async (req, res) => {
  const categories = await db.all('SELECT * FROM categories');
  res.json(categories);
});

// Add a category
app.post('/api/categories', async (req, res) => {
  const { name } = req.body;
  await db.run('INSERT INTO categories (name) VALUES (?)', name);
  broadcastUpdate();
  res.status(201).json({ message: 'Category added' });
});

// Delete a category
app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  await db.run('DELETE FROM items WHERE category_id = ?', id);
  await db.run('DELETE FROM categories WHERE id = ?', id);
  broadcastUpdate();
  res.json({ message: 'Category deleted' });
});

// Get items for a category
app.get('/api/items/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  const items = await db.all('SELECT * FROM items WHERE category_id = ?', categoryId);
  res.json(items);
});

// Add an item
app.post('/api/items', async (req, res) => {
  const { name, completed, category_id, added_by } = req.body;
  const result = await db.run(
    'INSERT INTO items (name, completed, category_id, added_by) VALUES (?, ?, ?, ?)',
    name, completed ? 1 : 0, category_id, added_by
  );
  const item = await db.get('SELECT * FROM items WHERE id = ?', result.lastID);
  broadcastUpdate();
  res.status(201).json(item);
});

// Update item completion
app.put('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  await db.run('UPDATE items SET completed = ? WHERE id = ?', completed ? 1 : 0, id);
  broadcastUpdate();
  res.json({ message: 'Item updated' });
});

// Delete an item
app.delete('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  await db.run('DELETE FROM items WHERE id = ?', id);
  broadcastUpdate();
  res.json({ message: 'Item deleted' });
});

// Start the server
const PORT = process.env.PORT || 5000;

initDb().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
  });
});
