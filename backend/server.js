const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// SQLite DB setup
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./checklist.db');

// Listen for Socket.IO connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Emit event from within routes
const emitUpdate = () => io.emit('update');

// ---------------- Routes ----------------

// Add Category
app.post('/api/categories', (req, res) => {
  const { name } = req.body;
  db.run('INSERT INTO categories (name) VALUES (?)', [name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    emitUpdate();
    res.json({ id: this.lastID, name });
  });
});

// Delete Category
app.delete('/api/categories/:id', (req, res) => {
  db.run('DELETE FROM categories WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    emitUpdate();
    res.sendStatus(204);
  });
});

// Get Categories
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add Item
app.post('/api/items', (req, res) => {
  const { name, completed, category_id, added_by } = req.body;
  db.run(
    'INSERT INTO items (name, completed, category_id, added_by) VALUES (?, ?, ?, ?)',
    [name, completed ? 1 : 0, category_id, added_by],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      emitUpdate();
      res.json({ id: this.lastID, name, completed, category_id, added_by });
    }
  );
});

// Delete Item
app.delete('/api/items/:id', (req, res) => {
  db.run('DELETE FROM items WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    emitUpdate();
    res.sendStatus(204);
  });
});

// Get Items for Category
app.get('/api/items/:categoryId', (req, res) => {
  db.all('SELECT * FROM items WHERE category_id = ?', [req.params.categoryId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Toggle Item
app.put('/api/items/:id', (req, res) => {
  const { completed } = req.body;
  db.run(
    'UPDATE items SET completed = ? WHERE id = ?',
    [completed ? 1 : 0, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      emitUpdate();
      res.sendStatus(200);
    }
  );
});

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
