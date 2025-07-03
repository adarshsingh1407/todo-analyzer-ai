import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

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

// POST /analyze - Analyze todos and provide insights
app.post("/analyze", async (req, res) => {
  try {
    const { todos, filter } = req.body;

    if (!todos || !Array.isArray(todos)) {
      return res.status(400).json({ error: "Todos array is required" });
    }

    // Group todos by status
    const todosByStatus = todos.reduce((acc, todo) => {
      acc[todo.status] = acc[todo.status] || [];
      acc[todo.status].push(todo);
      return acc;
    }, {});

    const totalCount = todos.length;
    const doneCount = todosByStatus["Done"]?.length || 0;
    const inProgressCount = todosByStatus["In Progress"]?.length || 0;
    const todoCount = todosByStatus["ToDo"]?.length || 0;

    // Create prompt for Ollama
    let contextMessage = "";
    if (filter) {
      if (filter === "remaining") {
        contextMessage =
          "You are analyzing the REMAINING todos (those not yet completed).";
      } else {
        contextMessage = `You are analyzing todos with status: ${filter}.`;
      }
    } else {
      contextMessage = "You are analyzing the complete todo list.";
    }

    const prompt = `You are a productivity assistant analyzing a todo list.

${contextMessage}

Current todo status:
- Total todos: ${totalCount}
- Done: ${doneCount}
- In Progress: ${inProgressCount}
- To Do: ${todoCount}

Todo items:
${todos.map((todo) => `- ${todo.text} (${todo.status})`).join("\n")}

Please provide:
1. A brief summary of the current state
2. Productivity insights and suggestions
3. Recommended next actions
4. Any patterns or observations

Keep the response concise but helpful. Focus on actionable advice.`;

    const analysis = await callOllama(prompt);

    res.json({
      summary: analysis,
      stats: {
        total: totalCount,
        done: doneCount,
        inProgress: inProgressCount,
        todo: todoCount,
      },
    });
  } catch (error) {
    console.error("Error analyzing todos:", error);
    res.status(500).json({
      error: "Failed to analyze todos",
      message: error.message,
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "todo-analyzer-service" });
});

app.listen(PORT, () => {
  console.log(`Todo Analyzer Service running on port ${PORT}`);
});
