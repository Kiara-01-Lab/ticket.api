# 01 - Quickstart

> The simplest possible ticket.api demo. See it work in under 1 minute.

## What This Demonstrates

- Initializing ticket.api
- Creating a board with a built-in workflow
- Adding tickets with priorities and labels
- Moving tickets through workflow states
- Displaying a Kanban view

## Quick Start

```bash
npm install
npm start
```

## Expected Output

```
🎫 ticket.api - Quickstart Demo

✅ Initialized ticket.api

📋 Created board: "My First Board" (abc123)

🎫 Creating tickets...
   • Learn ticket.api basics [high]
   • Build a custom workflow [medium]
   • Deploy to production [low]
   • Write documentation [medium]

➡️  Moved "Learn ticket.api basics" to in_progress
➡️  Moved "Build a custom workflow" to todo
➡️  Moved "Deploy to production" to done

════════════════════════════════════════════════════════════
📊 KANBAN BOARD: My First Board
════════════════════════════════════════════════════════════

📥 BACKLOG (1)
────────────────────────────────────────
   🟡 Write documentation [docs]

📋 TODO (1)
────────────────────────────────────────
   🟡 Build a custom workflow [feature]

🔨 IN_PROGRESS (1)
────────────────────────────────────────
   🔴 Learn ticket.api basics [learning]

👀 REVIEW (0)
────────────────────────────────────────
   (empty)

✅ DONE (1)
────────────────────────────────────────
   🟢 Deploy to production [devops]

════════════════════════════════════════════════════════════
🎉 Done! You just built a working Kanban board.
```

## Code Breakdown

### 1. Initialize

```javascript
const kit = await TicketKit.create();
```

Creates an in-memory instance. For persistence, use:

```javascript
const kit = await TicketKit.create({ dbPath: './mydata.db' });
```

### 2. Create Board

```javascript
const board = await kit.createBoard({ 
  name: 'My First Board',
  workflow_id: 'kanban'  // Built-in: kanban, scrum, support, simple
});
```

### 3. Add Tickets

```javascript
await kit.createTicket({
  board_id: board.id,
  title: 'My Task',
  priority: 'high',      // low, medium, high, urgent
  labels: ['feature']
});
```

### 4. Move Through Workflow

```javascript
await kit.moveTicket(ticket.id, 'in_progress');
```

### 5. Get Kanban View

```javascript
const { columns } = await kit.getKanbanView(board.id);
// columns = { backlog: [...], todo: [...], in_progress: [...], ... }
```

## Next Steps

- **[02-rest-api](../02-rest-api)** — Build a REST API
- **[03-react-kanban](../03-react-kanban)** — Full React frontend
- **[04-cli-tool](../04-cli-tool)** — Command-line task manager
