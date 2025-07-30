const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT NOT NULL,
      store_name TEXT NOT NULL,
      category TEXT NOT NULL,
      image_path TEXT NOT NULL,
      liked BOOLEAN,
      score INTEGER,
      tags TEXT,
      trip TEXT,
      comment TEXT,
      timestamp TEXT NOT NULL,
      UNIQUE(user, image_path)
    )`);
  }
});

app.get('/api/evaluations/:user', (req, res) => {
  const { user } = req.params;
  db.all('SELECT * FROM evaluations WHERE user = ?', [user], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const userEvaluations = {};
    rows.forEach(row => {
      userEvaluations[row.image_path] = {
        store: row.store_name,
        category: row.category,
        timestamp: row.timestamp,
        like: row.liked,
        stars: row.score,
        tags: row.tags ? JSON.parse(row.tags) : [],
        trip: row.trip,
        comment: row.comment
      };
    });
    res.json(userEvaluations);
  });
});

app.post('/api/evaluations', (req, res) => {
  const { user, store, category, image, like, stars, tags, trip, comment } = req.body;

  if (!user || !store || !image || !category) {
    return res.status(400).json({ error: 'Faltan datos requeridos (user, store, category, image).' });
  }

  const timestamp = new Date().toISOString();
  const tagsJson = JSON.stringify(tags || []);

  const sql = `INSERT OR REPLACE INTO evaluations (user, store_name, category, image_path, liked, score, tags, trip, timestamp, comment)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [user, store, category, image, like, stars, tagsJson, trip, timestamp, comment];

  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, id: this.lastID });
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
