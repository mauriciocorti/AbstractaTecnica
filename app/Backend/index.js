const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "notesdb",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
});

// Init table on startup
async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log(" DB ready");
}

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/notes", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM notes ORDER BY created_at DESC");
  res.json(rows);
});

app.post("/notes", async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "content required" });
  const { rows } = await pool.query(
    "INSERT INTO notes (content) VALUES ($1) RETURNING *",
    [content]
  );
  res.status(201).json(rows[0]);
});

app.delete("/notes/:id", async (req, res) => {
  await pool.query("DELETE FROM notes WHERE id = $1", [req.params.id]);
  res.json({ deleted: true });
});

init().then(() => {
  app.listen(3000, () => console.log(" Backend on port 3000"));
});
