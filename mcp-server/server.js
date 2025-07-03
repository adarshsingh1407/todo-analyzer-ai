import express from "express";
import cors from "cors";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to call Ollama
async function callOllama(prompt) {
  try {
    const response = await fetch(
      "http://host.docker.internal:11434/api/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistral:latest",
          prompt: prompt,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error calling Ollama:", error);
    throw error;
  }
}

// Helper function to parse user input using Ollama
async function parseUserInput(input) {
  const prompt = `You are a command parser for a todo app.
Always respond with valid JSON in this exact format: { "action": "add|mark|summary", "task": "task description", "status": "ToDo|In Progress|Done", "filter": "remaining|ToDo|In Progress|Done" }

If the user input is a past tense verb describing a task, treat it as marking that task as Done (status: "Done").

Examples:
- "add buy groceries" → { "action": "add", "task": "buy groceries", "status": "ToDo", "filter": "" }
- "mark buy groceries as done" → { "action": "mark", "task": "buy groceries", "status": "Done", "filter": "" }
- "mark buy groceries as in progress" → { "action": "mark", "task": "buy groceries", "status": "In Progress", "filter": "" }
- "give me a summary" → { "action": "summary", "task": "", "status": "", "filter": "" }
- "give me summary of remaining todos" → { "action": "summary", "task": "", "status": "", "filter": "remaining" }
- "give me summary of todos in progress" → { "action": "summary", "task": "", "status": "", "filter": "In Progress" }
- "summary of done todos" → { "action": "summary", "task": "", "status": "", "filter": "Done" }
- "I took buzzy outside" → { "action": "mark", "task": "take buzzy outside", "status": "Done", "filter": "" }

User input: "${input}"

Respond with JSON only:`;

  try {
    const response = await callOllama(prompt);
    const jsonMatch = response.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid JSON response from Ollama");
  } catch (error) {
    console.error("Error parsing user input:", error);
    throw error;
  }
}

// POST /handle - Main endpoint for processing user commands
app.post("/handle", async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ error: "Input is required" });
    }

    console.log("Processing input:", input);

    // Parse the user input using Ollama
    const parsed = await parseUserInput(input);
    console.log("Parsed command:", parsed);

    let message = "";

    switch (parsed.action) {
      case "add":
        // Add new todo
        const addResponse = await fetch(
          "http://todo-management-service:4000/todos",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: parsed.task,
              status: parsed.status || "ToDo",
            }),
          }
        );

        if (!addResponse.ok) {
          throw new Error("Failed to add todo");
        }

        message = `Added todo: "${parsed.task}"`;
        break;

      case "mark":
        // Get all todos to find the matching one
        const getResponse = await fetch(
          "http://todo-management-service:4000/todos"
        );
        if (!getResponse.ok) {
          throw new Error("Failed to fetch todos");
        }

        const todos = await getResponse.json();
        const todoToUpdate = todos.find((todo) =>
          todo.text.toLowerCase().includes(parsed.task.toLowerCase())
        );

        if (!todoToUpdate) {
          message = `Todo "${parsed.task}" not found`;
        } else {
          // Update the todo status
          const updateResponse = await fetch(
            `http://todo-management-service:4000/todos/${todoToUpdate.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                status: parsed.status,
              }),
            }
          );

          if (!updateResponse.ok) {
            throw new Error("Failed to update todo");
          }

          message = `Marked "${todoToUpdate.text}" as ${parsed.status}`;
        }
        break;

      case "summary":
        // Get todos for summary with optional filtering
        let summaryUrl = "http://todo-management-service:4000/todos";
        if (parsed.filter) {
          summaryUrl += `?status=${encodeURIComponent(parsed.filter)}`;
        }

        const summaryGetResponse = await fetch(summaryUrl);
        if (!summaryGetResponse.ok) {
          throw new Error("Failed to fetch todos for summary");
        }

        const todosForSummary = await summaryGetResponse.json();

        // Get summary from analyzer service
        const summaryResponse = await fetch(
          "http://todo-analyzer-service:5000/analyze",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              todos: todosForSummary,
              filter: parsed.filter,
            }),
          }
        );

        if (!summaryResponse.ok) {
          throw new Error("Failed to get summary");
        }

        const summaryData = await summaryResponse.json();
        message = summaryData.summary;
        break;

      default:
        message = "Unknown action. Please try: add, mark, or summary";
    }

    res.json({
      message,
      action: parsed.action,
    });
  } catch (error) {
    console.error("Error in /handle:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /todos - Proxy to todo management service
app.get("/todos", async (req, res) => {
  try {
    const response = await fetch("http://todo-management-service:4000/todos");

    if (!response.ok) {
      throw new Error("Failed to fetch todos");
    }

    const todos = await response.json();
    res.json(todos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "MCP Server for Todo App",
    service: "mcp-server",
    endpoints: {
      "POST /handle": "Process user commands via Ollama",
      "GET /todos": "Get all todos (proxy to todo-management-service)",
      "GET /health": "Health check",
    },
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "mcp-server" });
});

app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});
