# 02 - REST API

> A complete REST API for task management using Express.

## What This Demonstrates

- Full CRUD operations for boards and tickets
- Moving tickets through workflows
- Comments with threading
- Subtasks
- Search functionality
- Export/Import
- Error handling
- User identification via headers

## Quick Start

```bash
npm install
npm start
```

Server runs at `http://localhost:3000`

## Run the Demo

In another terminal:

```bash
npm run demo
```

This creates a board, tickets, moves them around, adds comments, and shows the Kanban view.

## API Endpoints

### Boards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/boards` | List all boards |
| POST | `/boards` | Create a board |
| GET | `/boards/:id` | Get a board |
| PATCH | `/boards/:id` | Update a board |
| DELETE | `/boards/:id` | Delete a board |
| GET | `/boards/:id/kanban` | Get Kanban view |
| GET | `/boards/:id/tickets` | List tickets |
| POST | `/boards/:id/tickets` | Create a ticket |
| GET | `/boards/:id/search` | Search tickets |

### Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tickets/:id` | Get a ticket |
| PATCH | `/tickets/:id` | Update a ticket |
| DELETE | `/tickets/:id` | Delete a ticket |
| POST | `/tickets/:id/move` | Move to new status |
| POST | `/tickets/:id/assign` | Assign to users |
| GET | `/tickets/:id/activity` | Get activity log |
| GET | `/tickets/:id/subtasks` | List subtasks |
| POST | `/tickets/:id/subtasks` | Create subtask |
| GET | `/tickets/:id/comments` | List comments |
| POST | `/tickets/:id/comments` | Add comment |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workflows` | List workflows |
| GET | `/workflows/:id` | Get workflow |
| POST | `/workflows` | Create custom workflow |
| GET | `/export` | Export all data |
| POST | `/import` | Import data |

## Examples

### Create a Board

```bash
curl -X POST http://localhost:3000/boards \
  -H "Content-Type: application/json" \
  -d '{"name": "My Project", "workflow_id": "kanban"}'
```

### Create a Ticket

```bash
curl -X POST http://localhost:3000/boards/BOARD_ID/tickets \
  -H "Content-Type: application/json" \
  -H "X-User-Id: alice" \
  -d '{
    "title": "Fix login bug",
    "priority": "high",
    "labels": ["bug", "auth"]
  }'
```

### Move a Ticket

```bash
curl -X POST http://localhost:3000/tickets/TICKET_ID/move \
  -H "Content-Type: application/json" \
  -H "X-User-Id: alice" \
  -d '{"status": "in_progress"}'
```

### Get Kanban View

```bash
curl http://localhost:3000/boards/BOARD_ID/kanban
```

Response:

```json
{
  "board": { "id": "...", "name": "My Project" },
  "workflow": { "id": "kanban", "states": [...] },
  "columns": {
    "backlog": [...],
    "todo": [...],
    "in_progress": [...],
    "review": [...],
    "done": [...]
  }
}
```

### Search Tickets

```bash
# By status
curl "http://localhost:3000/boards/BOARD_ID/search?q=status:in_progress"

# By label
curl "http://localhost:3000/boards/BOARD_ID/search?q=label:bug"

# By priority
curl "http://localhost:3000/boards/BOARD_ID/search?q=priority:urgent"

# Combined
curl "http://localhost:3000/boards/BOARD_ID/search?q=priority:high%20label:bug"
```

### Add a Comment

```bash
curl -X POST http://localhost:3000/tickets/TICKET_ID/comments \
  -H "Content-Type: application/json" \
  -H "X-User-Id: alice" \
  -d '{"content": "Found the root cause!"}'
```

### Reply to a Comment

```bash
curl -X POST http://localhost:3000/tickets/TICKET_ID/comments \
  -H "Content-Type: application/json" \
  -H "X-User-Id: bob" \
  -d '{
    "content": "Great, can you fix it today?",
    "parent_id": "COMMENT_ID"
  }'
```

## Configuration

| Env Variable | Default | Description |
|--------------|---------|-------------|
| `PORT` | `3000` | Server port |
| `DB_PATH` | `./data.db` | SQLite database path |

## User Identification

Pass the user ID in the `X-User-Id` header:

```bash
curl -H "X-User-Id: alice" http://localhost:3000/boards/123/tickets
```

This is used for:
- Activity log (who did what)
- Comment authorship
- Ticket assignments

## Deployment

### Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

### Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

## Next Steps

- **[03-react-kanban](../03-react-kanban)** — Add a React frontend
- **[05-slack-bot](../05-slack-bot)** — Slack integration
- **[verticals/](../verticals)** — Industry-specific examples
