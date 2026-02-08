// import * as SQLite from 'expo-sqlite';

// let db;

// export const initDB = async () => {
//   db = await SQLite.openDatabaseAsync('expenses.db');

//   await db.execAsync(`
//     CREATE TABLE IF NOT EXISTS users (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       username TEXT UNIQUE
//     );

//     CREATE TABLE IF NOT EXISTS expenses (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       user_id INTEGER,
//       title TEXT,
//       amount REAL,
//       category TEXT,
//       date TEXT
//     );
//   `);
// };

// export const getDB = () => db;

// ================================================================
// ================================================================
// ================================================================

import * as SQLite from 'expo-sqlite';

let db;

export const initDB = async () => {
  db = await SQLite.openDatabaseAsync('fintech_manager.db');

  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    --------------------------------------------------
    -- USERS TABLE
    --------------------------------------------------
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    --------------------------------------------------
    -- CATEGORIES TABLE
    --------------------------------------------------
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      color TEXT,
      icon TEXT,
      is_default INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    --------------------------------------------------
    -- TRANSACTIONS TABLE
    --------------------------------------------------
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      category_id INTEGER,
      notes TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    --------------------------------------------------
    -- BUDGETS TABLE
    --------------------------------------------------
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      limit_amount REAL NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    --------------------------------------------------
    -- RECURRING TRANSACTIONS TABLE
    --------------------------------------------------
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      category_id INTEGER,
      frequency TEXT NOT NULL CHECK(frequency IN ('weekly','monthly')),
      next_due_date TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);
};

export const getDB = () => db;
