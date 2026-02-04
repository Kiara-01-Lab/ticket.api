/**
 * ticket.api - React Kanban Backend
 * 
 * Simple Express server that powers the React frontend.
 */

const express = require('express');
const cors = require('cors');
const { TicketKit } = require('ticketkit');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let kit;

// ── Boards ──────────────────────────────────────────────────────────────────

app.get('/api/boards', async (req, res) => {
  const boards = await kit.listBoards();
  res.json(boards);
});

app.post('/api/boards', async (req, res) => {
  const board = await kit.createBoard(req.body);
  res.status(201).json(board);
});

app.get('/api/boards/:id', async (req, res) => {
  const board = await kit.getBoard(req.params.id);
  res.json(board);
});

app.get('/api/boards/:id/kanban', async (req, res) => {
  const view = await kit.getKanbanView(req.params.id);
  res.json(view);
});

// ── Tickets ─────────────────────────────────────────────────────────────────

app.post('/api/boards/:id/tickets', async (req, res) => {
  const ticket = await kit.createTicket({
    ...req.body,
    board_id: req.params.id
  });
  res.status(201).json(ticket);
});

app.patch('/api/tickets/:id', async (req, res) => {
  await kit.updateTicket(req.params.id, req.body);
  const ticket = await kit.getTicket(req.params.id);
  res.json(ticket);
});

app.delete('/api/tickets/:id', async (req, res) => {
  await kit.deleteTicket(req.params.id);
  res.status(204).send();
});

app.post('/api/tickets/:id/move', async (req, res) => {
  await kit.moveTicket(req.params.id, req.body.status);
  const ticket = await kit.getTicket(req.params.id);
  res.json(ticket);
});

app.get('/api/tickets/:id', async (req, res) => {
  const ticket = await kit.getTicket(req.params.id);
  res.json(ticket);
});

// ── Comments ────────────────────────────────────────────────────────────────

app.get('/api/tickets/:id/comments', async (req, res) => {
  const comments = await kit.listComments(req.params.id);
  res.json(comments);
});

app.post('/api/tickets/:id/comments', async (req, res) => {
  const comment = await kit.addComment(
    req.params.id,
    req.body.content,
    req.body.author || 'Anonymous'
  );
  res.status(201).json(comment);
});

// ── Activity ────────────────────────────────────────────────────────────────

app.get('/api/tickets/:id/activity', async (req, res) => {
  const activity = await kit.getActivity(req.params.id);
  res.json(activity);
});

// ── Assignees ───────────────────────────────────────────────────────────────

app.post('/api/tickets/:id/assign', async (req, res) => {
  await kit.assignTicket(req.params.id, req.body.assignees);
  const ticket = await kit.getTicket(req.params.id);
  res.json(ticket);
});

// ── Subtasks ────────────────────────────────────────────────────────────────

app.get('/api/tickets/:id/subtasks', async (req, res) => {
  const subtasks = await kit.getSubtasks(req.params.id);
  res.json(subtasks);
});

app.post('/api/tickets/:id/subtasks', async (req, res) => {
  const subtask = await kit.createSubtask(req.params.id, req.body);
  res.status(201).json(subtask);
});

// ── Search ──────────────────────────────────────────────────────────────────

app.get('/api/search', async (req, res) => {
  const { board_id, q, priority, label } = req.query;

  if (q) {
    const results = await kit.search(board_id, q);
    res.json(results);
  } else {
    // Return all tickets for the board if no search query
    const tickets = await kit.listTickets({ board_id });
    let filtered = tickets;

    if (priority) {
      filtered = filtered.filter(t => t.priority === priority);
    }
    if (label) {
      filtered = filtered.filter(t => t.labels && t.labels.includes(label));
    }

    res.json(filtered);
  }
});

// ── Seed Data ───────────────────────────────────────────────────────────────

async function seedData() {
  const boards = await kit.listBoards();
  
  if (boards.length === 0) {
    console.log('📦 Seeding demo data...');
    
    const board = await kit.createBoard({
      name: 'Demo Project',
      workflow_id: 'kanban'
    });
    
    const tickets = [
      { title: 'Research competitors', priority: 'medium', labels: ['research'] },
      { title: 'Design system setup', priority: 'high', labels: ['design'] },
      { title: 'Set up CI/CD', priority: 'medium', labels: ['devops'] },
      { title: 'User authentication', priority: 'high', labels: ['backend', 'auth'] },
      { title: 'Landing page', priority: 'urgent', labels: ['frontend'] },
      { title: 'Database schema', priority: 'high', labels: ['backend'] },
    ];
    
    for (const data of tickets) {
      await kit.createTicket({ board_id: board.id, ...data });
    }
    
    // Move some tickets
    const all = await kit.listTickets({ board_id: board.id });
    await kit.moveTicket(all[0].id, 'todo');
    await kit.moveTicket(all[1].id, 'todo');
    await kit.moveTicket(all[1].id, 'in_progress');
    await kit.moveTicket(all[2].id, 'todo');
    await kit.moveTicket(all[2].id, 'in_progress');
    await kit.moveTicket(all[2].id, 'review');
    await kit.moveTicket(all[3].id, 'todo');
    await kit.moveTicket(all[3].id, 'in_progress');
    await kit.moveTicket(all[3].id, 'review');
    await kit.moveTicket(all[3].id, 'done');
    
    console.log(`   Created board: ${board.name}`);
    console.log(`   Created ${tickets.length} tickets`);
  }
}

// ── Start ───────────────────────────────────────────────────────────────────

async function start() {
  kit = await TicketKit.create({ dbPath: './data.db' });
  
  await seedData();
  
  app.listen(PORT, () => {
    console.log(`\n🎫 ticket.api server running at http://localhost:${PORT}`);
    console.log(`   API endpoints at http://localhost:${PORT}/api/*\n`);
  });
}

start().catch(console.error);
