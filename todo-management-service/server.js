import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;
const app = express();
const PORT = 4000;

// Database configuration
const pool = new Pool({
  user: "todo_user",
  host: "postgres",
  database: "todos",
  password: "todo_pass",
  port: 5432,
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
async function initializeDatabase() {
  try {
    const client = await pool.connect();

    // Create table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        status TEXT DEFAULT 'ToDo'
      );
    `);

    client.release();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// POST /todos - Create a new todo
app.post("/todos", async (req, res) => {
  try {
    const { text, status = "ToDo" } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const result = await pool.query(
      "INSERT INTO todos (text, status) VALUES ($1, $2) RETURNING *",
      [text, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

// GET /todos - Get all todos with optional status filter
app.get("/todos", async (req, res) => {
  try {
    const { status } = req.query;

    let query = "SELECT * FROM todos";
    let params = [];

    if (status) {
      if (status === "remaining") {
        // "remaining" means not done
        query += " WHERE status != 'Done'";
      } else {
        // Filter by specific status
        query += " WHERE status = $1";
        params.push(status);
      }
    }

    query += " ORDER BY id ASC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// PATCH /todos/:id - Update todo status
app.patch("/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const result = await pool.query(
      "UPDATE todos SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({ error: "Failed to update todo" });
  }
});

// DELETE /todos/:id - Delete a todo
app.delete("/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM todos WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res.json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "todo-management-service" });
});

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Todo Management Service running on port ${PORT}`);
  });
});
