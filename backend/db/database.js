import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Promisify sqlite3
sqlite3.verbose();

export async function openDb() {
  return open({
    filename: './backend/db/data.db',
    driver: sqlite3.Database
  });
}
