import express from 'express';
import { openDb } from '../db/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const db = await openDb();
  const items = await db.all('SELECT * FROM checklist');
  res.json(items);
});

router.post('/', async (req, res) => {
  const db = await openDb();
  const { item, username } = req.body;
  await db.run('INSERT INTO checklist (item, username) VALUES (?, ?)', [item, username]);
  res.status(201).json({ message: 'Item added' });
});

router.delete('/:id', async (req, res) => {
  const db = await openDb();
  await db.run('DELETE FROM checklist WHERE id = ?', [req.params.id]);
  res.json({ message: 'Item deleted' });
});


export default router;
