# TicketKit Examples

> Production-ready examples showing how to build with TicketKit.

## 📂 Examples

| Example | Description | Stack |
|---------|-------------|-------|
| [react-kanban](./react-kanban) | Full-stack Kanban board with drag-and-drop UI | React + Express + TicketKit |
| [wedding-planner](./wedding-planner) | Vertical SaaS for wedding planners | React + Express + Custom Workflows |

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Kiara-01-Lab/ticket.api-public.git
cd ticket.api-public/ticketkit-examples

# Run React Kanban
cd react-kanban
npm run install:all
npm run dev
# → Frontend: http://localhost:5173
# → Backend: http://localhost:3001

# Or run Wedding Planner
cd wedding-planner
npm run install:all
npm run dev
# → Frontend: http://localhost:5174
# → Backend: http://localhost:3002
```

## 📋 Examples Overview

### 1. React Kanban Board

A complete task management application with:

**Features:**
- ✅ Kanban board view (todo → in-progress → done)
- ✅ Drag-and-drop interface
- ✅ Create, update, and delete tickets
- ✅ Priority levels (low, medium, high, urgent)
- ✅ Real-time updates
- ✅ Responsive design

**Tech Stack:**
- **Frontend:** React + Vite
- **Backend:** Express REST API
- **Database:** SQLite (in-memory)
- **SDK:** TicketKit with default Kanban workflow

**Use Cases:** Simple task tracking, personal projects, small team workflows

[View Architecture Diagram](./react-kanban/architecture.svg)

---

### 2. Wedding Planner (Vertical SaaS)

A specialized vertical SaaS for wedding planning professionals:

**Features:**
- 📋 **Multi-Event Dashboard** — Manage multiple weddings simultaneously
- 🎯 **Vendor Pipeline** — Track vendors through 10-state workflow
- ✅ **Client Decision Queue** — Manage approvals with 6-state workflow
- ⚠️ **Ghosting Alerts** — Detect vendors who haven't responded
- 📇 **Contact Management** — Centralized contact sheet for day-of logistics
- 📊 **Activity Audit Trail** — Immutable record of all decisions

**Custom Workflows:**

```javascript
// Vendor Workflow (10 states)
researching → outreach_sent → responded → quote_requested →
quote_received → shortlisted → decision_pending → booked →
contract_sent → contract_signed

// Client Decision Workflow (6 states)
drafting → presented → client_reviewing → approved →
contracted → completed
```

**Tech Stack:**
- **Frontend:** React + Vite with polished UI
- **Backend:** Express with specialized endpoints
- **Database:** SQLite with custom fields
- **SDK:** TicketKit with 2 custom workflows

**Pain Points Solved:**
1. Vendor follow-up tracking (ghosting detection)
2. Client decision visibility
3. Approval audit trail
4. Centralized contact information
5. Task dependencies
6. Multi-event dashboard

**Use Cases:** Wedding planners, event coordinators, hospitality services

[View Architecture Diagram](./wedding-planner/architecture.svg)

---

## 🔌 Feature Comparison

| Feature | React Kanban | Wedding Planner |
|---------|:------------:|:---------------:|
| Kanban board | ✅ | ✅ |
| Create/update/delete tickets | ✅ | ✅ |
| Default workflow | ✅ | |
| Custom workflows | | ✅ (2 workflows) |
| Custom fields | | ✅ |
| Multi-board architecture | | ✅ |
| Specialized endpoints | | ✅ |
| Activity logs | ✅ | ✅ |
| Search & filtering | ✅ | ✅ |
| Priority management | ✅ | ✅ |
| Drag-and-drop | ✅ | |
| Industry-specific UI | | ✅ |

## 🛠️ Running Examples

Each example is self-contained with its own package.json:

```bash
# React Kanban
cd react-kanban
npm run install:all  # Installs both client and server
npm run dev          # Runs both concurrently
# Or separately:
cd server && npm start
cd client && npm run dev

# Wedding Planner
cd wedding-planner
npm run install:all  # Installs both client and server
npm run dev          # Runs both concurrently
# Or separately:
cd server && npm start
cd client && npm run dev
```

## 📝 Creating Your Own Vertical

Both examples demonstrate how to build vertical SaaS applications with TicketKit:

### 1. Define Your Workflow

```javascript
await kit.createWorkflow({
  id: 'my-vertical-flow',
  name: 'My Workflow',
  states: ['state1', 'state2', 'state3'],
  transitions: {
    state1: ['state2'],
    state2: ['state3'],
    state3: []
  }
});
```

### 2. Add Custom Fields

```javascript
const ticket = await kit.createTicket({
  board_id: board.id,
  title: 'My Item',
  custom_fields: {
    client_name: 'John Doe',
    contact_email: 'john@example.com',
    deadline: '2024-12-31',
    // ... any domain-specific data
  }
});
```

### 3. Build Specialized Endpoints

```javascript
// Example: Find stale items
app.get('/api/board/:id/stale-items', async (req, res) => {
  const tickets = await kit.listTickets({
    board_id: req.params.id,
    status: 'pending'
  });

  const stale = tickets.filter(t => {
    const daysSinceUpdate = (Date.now() - new Date(t.updated_at)) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > 7;
  });

  res.json(stale);
});
```

### 4. Create Industry-Specific UI

See the Wedding Planner example for:
- Multi-board dashboard
- Status-specific styling
- Alert systems (ghosting detection)
- Contact sheets
- Decision queues

## 🎯 Potential Verticals

TicketKit can power vertical SaaS for:

- **Healthcare:** Patient flow, appointment tracking (vet clinics, dental labs)
- **Events:** Wedding planning, catering, venue management
- **Real Estate:** Property pipeline, client journey
- **Education:** Student applications, course planning
- **Legal:** Case management, document workflow
- **Construction:** Project milestones, vendor coordination
- **Hospitality:** Reservations, guest services

## 🤝 Contributing Examples

We welcome new examples! Ideas:

- **Integrations** — Slack, Discord, GitHub webhooks
- **Frameworks** — Next.js, Remix, SvelteKit
- **Verticals** — Dental lab, auto shop, funeral home
- **Features** — File attachments, real-time WebSockets

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## 📄 License

MIT — use these examples however you like.
