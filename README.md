# 🎫 ticket.api

**Build your own task board like JIRA, Trello, Asana in minutes.**

A lightweight JavaScript SDK for creating task boards, ticket systems, and project trackers. No complex setup — just install and start building.

[![npm version](https://img.shields.io/npm/v/ticketkit.svg)](https://www.npmjs.com/package/ticketkit)
[![npm downloads](https://img.shields.io/npm/dm/ticketkit.svg)](https://www.npmjs.com/package/ticketkit)
[![Tests](https://github.com/Kiara-01-Lab/ticket.api-public/actions/workflows/tests.yml/badge.svg)](https://github.com/Kiara-01-Lab/ticket.api-public/actions/workflows/tests.yml)
[![codecov](https://codecov.io/gh/Kiara-01-Lab/ticket.api-public/branch/main/graph/badge.svg)](https://codecov.io/gh/Kiara-01-Lab/ticket.api-public)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/ticketkit)](https://bundlephobia.com/package/ticketkit)
[![GitHub Release](https://img.shields.io/github/v/release/Kiara-01-Lab/ticket.api-public?include_prereleases)](https://github.com/Kiara-01-Lab/ticket.api-public/releases)
[![GitHub Issues](https://img.shields.io/github/issues/Kiara-01-Lab/ticket.api-public)](https://github.com/Kiara-01-Lab/ticket.api-public/issues)
[![GitHub Stars](https://img.shields.io/github/stars/Kiara-01-Lab/ticket.api-public?style=social)](https://github.com/Kiara-01-Lab/ticket.api-public/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Kiara-01-Lab/ticket.api-public?style=social)](https://github.com/Kiara-01-Lab/ticket.api-public/network/members)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/Kiara-01-Lab/ticket.api-public)](https://github.com/Kiara-01-Lab/ticket.api-public/commits/main)
[![GitHub Contributors](https://img.shields.io/github/contributors/Kiara-01-Lab/ticket.api-public)](https://github.com/Kiara-01-Lab/ticket.api-public/graphs/contributors)

---

## ✨ What You Can Build

<p align="center">
  <img src="./assets/screenshot-kanban.svg" alt="Kanban board example" width="600">
</p>

- **Project boards** — Kanban-style task management
- **Bug trackers** — Issue tracking with priorities and labels  
- **Support desks** — Ticket queues with workflow states
- **Sprint planners** — Scrum boards with backlogs

---

## 🚀 Quick Start

### 1. Install

```bash
npm install ticketkit
```

### 2. Create Your First Board

```javascript
const { TicketKit } = require('ticketkit');

// Initialize
const kit = await TicketKit.create();

// Create a board
const board = await kit.createBoard({ 
  name: 'My Project',
  workflow_id: 'kanban'  // or 'scrum', 'support', 'simple'
});

// Add a ticket
const ticket = await kit.createTicket({
  board_id: board.id,
  title: 'Build awesome feature',
  priority: 'high',
  labels: ['frontend']
});

// Move it through the workflow
await kit.moveTicket(ticket.id, 'in_progress');
```

### 3. Get Your Kanban View

```javascript
const { columns } = await kit.getKanbanView(board.id);

// columns = {
//   backlog: [...],
//   todo: [...],
//   in_progress: [ticket],
//   review: [...],
//   done: [...]
// }
```

**That's it!** You now have a working task board.

---

## 📋 Features

| Feature | Description |
|---------|-------------|
| **🔄 Workflows** | Kanban, Scrum, Support, or create your own |
| **✅ Validation** | Enforces valid status transitions |
| **💬 Comments** | Threaded discussions on tickets |
| **📝 Activity Log** | Automatic history of all changes |
| **🔍 Search** | Find tickets with simple queries |
| **📦 Subtasks** | Break tickets into smaller pieces |
| **🔌 Pluggable** | SQLite included, easy to swap databases |
| **📤 Export** | JSON import/export for backups |

---

## 🎨 Built-in Workflows

<p align="center">
  <img src="./assets/screenshot-workflows.svg" alt="Available workflows" width="600">
</p>

### Kanban (default)
```
backlog → todo → in_progress → review → done
```

### Scrum
```
backlog → sprint_backlog → in_progress → testing → done
```

### Support (Zendesk-style)
```
new → open → pending → solved → closed
```

### Simple (Trello-style)
```
todo → doing → done
```

### Custom Workflow
```javascript
await kit.createWorkflow({
  id: 'my-flow',
  name: 'Content Pipeline',
  states: ['draft', 'review', 'approved', 'published'],
  transitions: {
    draft: ['review'],
    review: ['draft', 'approved'],
    approved: ['published'],
    published: []
  }
});
```

---

## 📖 Common Tasks

### Create a ticket with all options

```javascript
const ticket = await kit.createTicket({
  board_id: board.id,
  title: 'Fix login bug',
  description: 'Users cannot login with SSO',
  status: 'todo',
  priority: 'urgent',        // low, medium, high, urgent
  labels: ['bug', 'auth'],
  assignees: ['alice', 'bob'],
  due_date: '2024-12-31',
  custom_fields: {
    estimated_hours: 4,
    sprint: 'Sprint 23'
  }
});
```

### Move and assign tickets

```javascript
// Move through workflow
await kit.moveTicket(ticket.id, 'in_progress');

// Assign to team members
await kit.assignTicket(ticket.id, ['charlie']);
```

### Add comments

```javascript
// Add a comment
const comment = await kit.addComment(
  ticket.id, 
  'Found the root cause!', 
  'alice'
);

// Reply to a comment
await kit.replyToComment(
  ticket.id, 
  comment.id, 
  'Great, can you fix it today?', 
  'bob'
);
```

### Search tickets

```javascript
// Find by status
const inProgress = await kit.search(board.id, 'status:in_progress');

// Find by label
const bugs = await kit.search(board.id, 'label:bug');

// Find by assignee
const myTickets = await kit.search(board.id, 'assignee:alice');

// Combine filters
const urgentBugs = await kit.search(board.id, 'priority:urgent label:bug');
```

### Create subtasks

```javascript
// Create a parent ticket
const epic = await kit.createTicket({
  board_id: board.id,
  title: 'User Authentication System'
});

// Add subtasks
await kit.createSubtask(epic.id, { title: 'Design login page' });
await kit.createSubtask(epic.id, { title: 'Implement OAuth' });
await kit.createSubtask(epic.id, { title: 'Add password reset' });

// Get all subtasks
const subtasks = await kit.getSubtasks(epic.id);
```

### View activity history

```javascript
const activity = await kit.getActivity(ticket.id);

// [
//   { actor: 'alice', action: 'created', created_at: '...' },
//   { actor: 'alice', action: 'status_changed', changes: { status: { old: 'backlog', new: 'todo' } } },
//   { actor: 'bob', action: 'assigned', changes: { assignees: ['charlie'] } },
//   { actor: 'charlie', action: 'commented', ... }
// ]
```

---

## 🔔 Events

Listen to changes for real-time updates:

```javascript
kit.on('ticket:created', (ticket) => {
  console.log(`New ticket: ${ticket.title}`);
  // Send notification, update UI, etc.
});

kit.on('ticket:updated', ({ ticket, changes }) => {
  console.log(`Ticket updated:`, changes);
});

kit.on('comment:created', (comment) => {
  console.log(`New comment by ${comment.author}`);
});
```

**Available events:**
- `ticket:created`, `ticket:updated`, `ticket:deleted`
- `board:created`, `board:updated`, `board:deleted`
- `comment:created`

---

## 💾 Storage Options

<p align="center">
  <img src="./assets/screenshot-architecture.svg" alt="Architecture diagram" width="600">
</p>

### SQLite (default, included)

```javascript
// In-memory (great for testing)
const kit = await TicketKit.create();

// File-based (persists data)
const kit = await TicketKit.create({ dbPath: './myproject.db' });
```

### Custom Storage Adapter

```javascript
const { StorageAdapter, TicketKit } = require('ticketkit');

class PostgresAdapter extends StorageAdapter {
  async init() { /* setup */ }
  async createTicket(data) { /* INSERT INTO tickets ... */ }
  async getTicket(id) { /* SELECT * FROM tickets WHERE id = ? */ }
  // ... implement other methods
}

const kit = await TicketKit.create({
  storage: new PostgresAdapter(process.env.DATABASE_URL)
});
```

---

## 📤 Import & Export

```javascript
// Export all data
const backup = await kit.export();
// { boards: [...], tickets: [...], version: '1.0.0' }

// Save to file
fs.writeFileSync('backup.json', JSON.stringify(backup));

// Import data
const data = JSON.parse(fs.readFileSync('backup.json'));
await kit.import(data);
```

---

## 📊 Data Models

<p align="center">
  <img src="./assets/screenshot-datamodel.svg" alt="Data model diagram" width="600">
</p>

### Ticket

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `board_id` | string | Parent board |
| `title` | string | Ticket title |
| `description` | string | Details |
| `status` | string | Current workflow state |
| `priority` | string | low, medium, high, urgent |
| `labels` | string[] | Tags/categories |
| `assignees` | string[] | Assigned users |
| `parent_id` | string? | For subtasks |
| `custom_fields` | object | Any extra data |
| `due_date` | string? | ISO date |
| `created_at` | string | ISO timestamp |
| `updated_at` | string | ISO timestamp |

### Board

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Board name |
| `description` | string | Details |
| `workflow_id` | string | Which workflow to use |
| `created_at` | string | ISO timestamp |

---

## 🛠️ Full API Reference

<details>
<summary><strong>Boards</strong></summary>

```javascript
// Create
const board = await kit.createBoard({ name, description?, workflow_id? });

// Read
const board = await kit.getBoard(id);
const boards = await kit.listBoards();

// Update
await kit.updateBoard(id, { name?, description?, workflow_id? });

// Delete
await kit.deleteBoard(id);
```
</details>

<details>
<summary><strong>Tickets</strong></summary>

```javascript
// Create
const ticket = await kit.createTicket(data, actor?);

// Read
const ticket = await kit.getTicket(id);
const tickets = await kit.listTickets({ board_id?, status?, priority?, assignee?, label?, search?, limit?, offset? });

// Update
await kit.updateTicket(id, updates, actor?);
await kit.moveTicket(id, newStatus, actor?);
await kit.assignTicket(id, assignees, actor?);
await kit.bulkUpdateTickets(ids, updates, actor?);

// Delete
await kit.deleteTicket(id, actor?);

// Subtasks
const subtask = await kit.createSubtask(parentId, data, actor?);
const subtasks = await kit.getSubtasks(parentId);
```
</details>

<details>
<summary><strong>Comments</strong></summary>

```javascript
const comment = await kit.addComment(ticketId, content, author);
const reply = await kit.replyToComment(ticketId, parentId, content, author);
const comments = await kit.listComments(ticketId);
```
</details>

<details>
<summary><strong>Views & Search</strong></summary>

```javascript
const { board, workflow, columns } = await kit.getKanbanView(boardId);
const backlog = await kit.getBacklog(boardId);
const results = await kit.search(boardId, 'status:todo label:bug');
```
</details>

<details>
<summary><strong>Workflows</strong></summary>

```javascript
const workflow = await kit.getWorkflow(id);
const custom = await kit.createWorkflow({ id, name, states, transitions });
```
</details>

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

```bash
# Clone the repo
git clone https://github.com/Kiara-01-Lab/ticket.api-public.git

# Install dependencies
cd ticketkit && npm install

# Run the demo
npm run demo
```

---

## 📄 License

MIT © 2025 Kiara Lab

---

<p align="center">
  <strong>Built with ❤️ for developers who want simple tools.</strong>
</p>
