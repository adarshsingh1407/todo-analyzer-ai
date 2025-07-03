# 🗂️ Todo Analyzer AI

## 🚀 Quick Start

A modern, AI-powered todo application with natural language processing capabilities. Built with Next.js, Express.js, PostgreSQL, and Ollama integration.

### Prerequisites

1. **Node.js 22**: Use the provided `.nvmrc` file
   ```bash
   nvm use
   ```
2. **Docker & Docker Compose**: For running the complete stack
3. **Ollama**: For AI processing (run manually)

   ```bash
   # Install Ollama (if not already installed)
   curl -fsSL https://ollama.ai/install.sh | sh

   # Start Ollama server
   ollama serve

   # Pull and run the mistral model
   ollama run mistral
   ```

### Running the Application

#### Development Mode (with hot reloading)

```bash
docker compose up --build
```

- Mounts source code for hot reloading
- Uses development Dockerfiles with watch mode
- Restarts on file changes

#### Production Mode

```bash
docker compose -f docker-compose.prod.yml up --build
```

- Open [http://localhost:8000](http://localhost:8000)
- Left: Todo list (auto-updates)
- Right: Chat interface for commands

---

## 🧠 Advanced Natural Language Support

- **Add todos**: "add buy groceries"
- **Mark as done**: "mark buy groceries as done"
- **Mark in progress**: "mark buy groceries as in progress"
- **Past tense = done**: "I took buzzy outside" (marks "take buzzy outside" as done)
- **Status filtering**: "give me summary of remaining todos", "give me summary of todos in progress"
- **Get summary**: "give me a summary"

---

## 🏗️ Architecture

This project follows a microservices architecture with the following components:

- **UI** (`ui/`): Next.js frontend with TypeScript and Tailwind CSS
- **MCP Server** (`mcp-server/`): Command parser that interfaces with Ollama
- **Todo Management Service** (`todo-management-service/`): CRUD operations for todos with PostgreSQL
- **Todo Analyzer Service** (`todo-analyzer-service/`): AI-powered analysis and insights
- **PostgreSQL**: Database for todo storage

## 🎯 Features

### Natural Language Commands

- **Add todos**: "add buy groceries"
- **Mark as done**: "mark buy groceries as done"
- **Mark in progress**: "mark buy groceries as in progress"
- **Get summary**: "give me a summary"

### AI-Powered Analysis

- Productivity insights
- Task prioritization suggestions
- Progress tracking
- Pattern recognition

### Modern UI

- 50/50 split layout
- Real-time updates
- Responsive design
- Beautiful chat interface

## 🛠️ Development

### Project Structure

```
todo-analyzer-ai/
├── ui/                          # Next.js frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   └── app/                 # App router pages
│   └── Dockerfile
├── mcp-server/                  # Command parser service
│   ├── server.js
│   └── Dockerfile
├── todo-management-service/     # CRUD operations
│   ├── server.js
│   ├── init.sql
│   └── Dockerfile
├── todo-analyzer-service/       # AI analysis
│   ├── server.js
│   └── Dockerfile
├── docker-compose.yml
├── .nvmrc
└── README.md
```

### Service Ports

- **UI**: http://localhost:8000
- **MCP Server**: http://localhost:3000
- **Todo Management**: http://localhost:4000
- **Todo Analyzer**: http://localhost:5001
- **PostgreSQL**: localhost:5432

### Technology Stack

- **Frontend**: Next.js 15.3.4, TypeScript, Tailwind CSS 4, React 19.0.0
- **Backend**: Express.js 5.1.0, Node.js 22
- **Database**: PostgreSQL 15
- **AI**: Ollama with Mistral model
- **Package Manager**: pnpm
- **Containerization**: Docker & Docker Compose

## 🔧 Configuration

### API Endpoints

#### MCP Server (Port 3000)

- `POST /handle` - Process natural language commands via Ollama
- `GET /todos` - Proxy to get all todos from todo-management-service
- `GET /health` - Health check
- `GET /` - Service information

#### Todo Management Service (Port 4000)

- `GET /todos` - Get all todos (supports `?status=filter` query parameter)
- `POST /todos` - Create a new todo
- `PATCH /todos/:id` - Update todo status
- `DELETE /todos/:id` - Delete a todo
- `GET /health` - Health check

#### Todo Analyzer Service (Port 5001)

- `POST /analyze` - Analyze todos and provide AI insights
- `GET /health` - Health check

#### UI (Port 8000)

- Frontend application with React Query for state management
- Real-time updates and optimistic UI updates

### Environment Variables

All services use default configurations. For production, consider setting:

- Database credentials
- Ollama model selection
- Service URLs
- CORS origins

### Database

The PostgreSQL database is automatically initialized with:

- User: `todo_user`
- Password: `todo_pass`
- Database: `todos`
- Sample data included

## 🧪 Testing

### Manual Testing

1. **Add a todo**: Type "add buy groceries" in the chat
2. **Mark as done**: Type "mark buy groceries as done"
3. **Get summary**: Type "give me a summary"

### Health Checks

Each service provides a health endpoint:

- `GET /health` - Returns service status

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Set production values
2. **Database**: Use managed PostgreSQL service
3. **Ollama**: Deploy Ollama separately or use cloud service
4. **Security**: Add authentication and rate limiting
5. **Monitoring**: Add logging and metrics

### Docker Deployment

```bash
# Build and run in production mode
docker compose -f docker-compose.yml up --build -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Troubleshooting

### Common Issues

1. **Ollama not responding**: Ensure Ollama is running and mistral model is available
2. **Database connection**: Check if PostgreSQL container is healthy
3. **Port conflicts**: Ensure ports 8000, 3000, 4000, 5001, 5432 are available

### Debug Commands

```bash
# Check service status
docker compose ps

# View service logs
docker compose logs [service-name]

# Restart a service
docker compose restart [service-name]

# Rebuild and restart
docker compose up --build [service-name]
```

---

**Happy coding! 🎉**
