# ticket.api Examples

> Ready-to-use examples showing how to build with ticket.api.

## 📂 Examples

| Example | Description | Complexity |
|---------|-------------|------------|
| [01-quickstart](./01-quickstart) | Minimal "hello world" demo | ⭐ |
| [02-rest-api](./02-rest-api) | Complete Express REST API | ⭐⭐ |
| [03-react-kanban](./03-react-kanban) | React frontend with drag-and-drop | ⭐⭐⭐ |
| [04-cli-tool](./04-cli-tool) | Command-line task manager | ⭐⭐ |

### 🏢 Vertical Industry Examples

| Example | Industry | Description |
|---------|----------|-------------|
| [vet-clinic](./verticals/vet-clinic) | Healthcare | Patient flow tracking for veterinary clinics |

## 🚀 Quick Start

```bash
# Clone the examples
git clone https://github.com/Kiara-02-Lab-OW/ticket.api.git
cd ticket.api/examples

# Run the quickstart
cd 01-quickstart
npm install
npm start
```

## 📋 Example Progression

**Recommended learning path:**

1. **[01-quickstart](./01-quickstart)** — Understand the basics
   - Initialize ticket.api
   - Create boards and tickets
   - Move tickets through workflows
   - Get Kanban view

2. **[02-rest-api](./02-rest-api)** — Build a backend
   - Express server setup
   - CRUD operations
   - Search and filtering
   - Comments and activity

3. **[03-react-kanban](./03-react-kanban)** — Add a frontend
   - React components
   - Drag-and-drop
   - Real-time updates
   - Responsive design

4. **[04-cli-tool](./04-cli-tool)** — Alternative interface
   - CLI argument parsing
   - Terminal colors
   - Persistent storage
   - Global installation

5. **[verticals/](./verticals)** — Real-world applications
   - Custom workflows
   - Industry-specific fields
   - Domain modeling

## 🔌 What Each Example Covers

### Core Features

| Feature | 01 | 02 | 03 | 04 | Vet |
|---------|:--:|:--:|:--:|:--:|:---:|
| Create boards | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create tickets | ✅ | ✅ | ✅ | ✅ | ✅ |
| Move tickets | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kanban view | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search | | ✅ | | | |
| Comments | | ✅ | | | |
| Subtasks | | ✅ | | | |
| Activity log | | ✅ | | | |
| Custom workflow | | | | | ✅ |
| Custom fields | | | | | ✅ |

### Technical Stack

| Technology | 01 | 02 | 03 | 04 | Vet |
|------------|:--:|:--:|:--:|:--:|:---:|
| Node.js | ✅ | ✅ | ✅ | ✅ | ✅ |
| Express | | ✅ | ✅ | | ✅ |
| React | | | ✅ | | |
| Vite | | | ✅ | | |
| CLI | | | | ✅ | |

## 🛠️ Running Examples

Each example is self-contained. Navigate to the directory and follow its README:

```bash
# REST API
cd 02-rest-api
npm install
npm start
# → http://localhost:3000

# React Kanban
cd 03-react-kanban
npm run install:all
npm run dev
# → http://localhost:5173

# CLI Tool
cd 04-cli-tool
npm install
npm link
ticket help

# Vet Clinic
cd verticals/vet-clinic
npm install
npm start
# → http://localhost:3000
```

## 📝 Creating Your Own Example

1. **Pick a use case** — What problem are you solving?

2. **Choose a workflow** — Use built-in or create custom:
   ```javascript
   // Built-in: kanban, scrum, support, simple
   const board = await kit.createBoard({ workflow_id: 'kanban' });
   
   // Custom
   await kit.createWorkflow({
     id: 'my-flow',
     states: ['draft', 'review', 'published'],
     transitions: { /* ... */ }
   });
   ```

3. **Define custom fields** — What data do you need?
   ```javascript
   const ticket = await kit.createTicket({
     title: 'My Item',
     custom_fields: {
       client_name: 'Acme Corp',
       due_date: '2024-03-01',
       // ... any data you need
     }
   });
   ```

4. **Build the API** — Use Express or your framework of choice

5. **Add a frontend** — React, Vue, vanilla JS, or CLI

## 🤝 Contributing Examples

We welcome new examples! Ideas:

- **Integrations** — Slack, Discord, GitHub, Zapier
- **Frameworks** — Next.js, Remix, Fastify, Hono
- **Verticals** — Dental lab, funeral home, auto shop, church
- **Features** — Real-time with WebSockets, file attachments

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## 📄 License

MIT — use these examples however you like.
