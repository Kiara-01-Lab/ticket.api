/**
 * ticket.api - REST API Example
 * 
 * A complete REST API for task management using Express.
 * 
 * Endpoints:
 *   GET    /boards              - List all boards
 *   POST   /boards              - Create a board
 *   GET    /boards/:id          - Get a board
 *   GET    /boards/:id/kanban   - Get Kanban view
 *   GET    /boards/:id/tickets  - List tickets on a board
 *   POST   /boards/:id/tickets  - Create a ticket
 *   GET    /tickets/:id         - Get a ticket
 *   PATCH  /tickets/:id         - Update a ticket
 *   DELETE /tickets/:id         - Delete a ticket
 *   POST   /tickets/:id/move    - Move ticket to new status
 *   POST   /tickets/:id/assign  - Assign ticket to users
 *   GET    /tickets/:id/comments - List comments
 *   POST   /tickets/:id/comments - Add a comment
 * 
 * Usage:
 *   npm start
 *   curl http://localhost:3000/boards
 */

const express = require('express');
const cors = require('cors');
const { TicketKit } = require('ticketkit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Store kit instance
let kit;

// ============================================================================
// BOARDS
// ============================================================================

// List all boards
app.get('/boards', async (req, res, next) => {
  try {
    const boards = await kit.listBoards();
    res.json({ boards });
  } catch (err) {
    next(err);
  }
});

// Create a board
app.post('/boards', async (req, res, next) => {
  try {
    const { name, description, workflow_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    
    const board = await kit.createBoard({ name, description, workflow_id });
    res.status(201).json(board);
  } catch (err) {
    next(err);
  }
});

// Get a board
app.get('/boards/:id', async (req, res, next) => {
  try {
    const board = await kit.getBoard(req.params.id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    res.json(board);
  } catch (err) {
    next(err);
  }
});

// Get Kanban view
app.get('/boards/:id/kanban', async (req, res, next) => {
  try {
    const view = await kit.getKanbanView(req.params.id);
    res.json(view);
  } catch (err) {
    next(err);
  }
});

// Update a board
app.patch('/boards/:id', async (req, res, next) => {
  try {
    const { name, description, workflow_id } = req.body;
    await kit.updateBoard(req.params.id, { name, description, workflow_id });
    const board = await kit.getBoard(req.params.id);
    res.json(board);
  } catch (err) {
    next(err);
  }
});

// Delete a board
app.delete('/boards/:id', async (req, res, next) => {
  try {
    await kit.deleteBoard(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// TICKETS
// ============================================================================

// List tickets on a board
app.get('/boards/:id/tickets', async (req, res, next) => {
  try {
    const { status, priority, assignee, label, search, limit, offset } = req.query;
    
    const tickets = await kit.listTickets({
      board_id: req.params.id,
      status,
      priority,
      assignee,
      label,
      search,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
    
    res.json({ tickets });
  } catch (err) {
    next(err);
  }
});

// Create a ticket
app.post('/boards/:id/tickets', async (req, res, next) => {
  try {
    const { title, description, status, priority, labels, assignees, due_date, custom_fields } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }
    
    const actor = req.headers['x-user-id'] || 'anonymous';
    
    const ticket = await kit.createTicket({
      board_id: req.params.id,
      title,
      description,
      status,
      priority,
      labels,
      assignees,
      due_date,
      custom_fields
    }, actor);
    
    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
});

// Get a ticket
app.get('/tickets/:id', async (req, res, next) => {
  try {
    const ticket = await kit.getTicket(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

// Update a ticket
app.patch('/tickets/:id', async (req, res, next) => {
  try {
    const actor = req.headers['x-user-id'] || 'anonymous';
    await kit.updateTicket(req.params.id, req.body, actor);
    const ticket = await kit.getTicket(req.params.id);
    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

// Delete a ticket
app.delete('/tickets/:id', async (req, res, next) => {
  try {
    const actor = req.headers['x-user-id'] || 'anonymous';
    await kit.deleteTicket(req.params.id, actor);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Move ticket to new status
app.post('/tickets/:id/move', async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }
    
    const actor = req.headers['x-user-id'] || 'anonymous';
    await kit.moveTicket(req.params.id, status, actor);
    
    const ticket = await kit.getTicket(req.params.id);
    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

// Assign ticket to users
app.post('/tickets/:id/assign', async (req, res, next) => {
  try {
    const { assignees } = req.body;
    
    if (!assignees || !Array.isArray(assignees)) {
      return res.status(400).json({ error: 'assignees array is required' });
    }
    
    const actor = req.headers['x-user-id'] || 'anonymous';
    await kit.assignTicket(req.params.id, assignees, actor);
    
    const ticket = await kit.getTicket(req.params.id);
    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

// Get ticket activity
app.get('/tickets/:id/activity', async (req, res, next) => {
  try {
    const activity = await kit.getActivity(req.params.id);
    res.json({ activity });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// SUBTASKS
// ============================================================================

// Get subtasks
app.get('/tickets/:id/subtasks', async (req, res, next) => {
  try {
    const subtasks = await kit.getSubtasks(req.params.id);
    res.json({ subtasks });
  } catch (err) {
    next(err);
  }
});

// Create subtask
app.post('/tickets/:id/subtasks', async (req, res, next) => {
  try {
    const { title, description, priority } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }
    
    const actor = req.headers['x-user-id'] || 'anonymous';
    const subtask = await kit.createSubtask(req.params.id, { title, description, priority }, actor);
    
    res.status(201).json(subtask);
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// COMMENTS
// ============================================================================

// List comments
app.get('/tickets/:id/comments', async (req, res, next) => {
  try {
    const comments = await kit.listComments(req.params.id);
    res.json({ comments });
  } catch (err) {
    next(err);
  }
});

// Add a comment
app.post('/tickets/:id/comments', async (req, res, next) => {
  try {
    const { content, parent_id } = req.body;
    const author = req.headers['x-user-id'] || 'anonymous';
    
    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }
    
    let comment;
    if (parent_id) {
      comment = await kit.replyToComment(req.params.id, parent_id, content, author);
    } else {
      comment = await kit.addComment(req.params.id, content, author);
    }
    
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// SEARCH
// ============================================================================

// Search tickets
app.get('/boards/:id/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'q (query) is required' });
    }
    
    const results = await kit.search(req.params.id, q);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// WORKFLOWS
// ============================================================================

// Get available workflows
app.get('/workflows', async (req, res, next) => {
  try {
    // Return built-in workflows
    const workflows = ['kanban', 'scrum', 'support', 'simple'];
    res.json({ workflows });
  } catch (err) {
    next(err);
  }
});

// Get a workflow
app.get('/workflows/:id', async (req, res, next) => {
  try {
    const workflow = await kit.getWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (err) {
    next(err);
  }
});

// Create custom workflow
app.post('/workflows', async (req, res, next) => {
  try {
    const { id, name, states, transitions } = req.body;
    
    if (!id || !name || !states || !transitions) {
      return res.status(400).json({ error: 'id, name, states, and transitions are required' });
    }
    
    const workflow = await kit.createWorkflow({ id, name, states, transitions });
    res.status(201).json(workflow);
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// EXPORT / IMPORT
// ============================================================================

// Export all data
app.get('/export', async (req, res, next) => {
  try {
    const data = await kit.export();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Import data
app.post('/import', async (req, res, next) => {
  try {
    await kit.import(req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ============================================================================
// STARTUP
// ============================================================================

async function start() {
  // Initialize ticket.api with file-based storage
  const dbPath = process.env.DB_PATH || './data.db';
  kit = await TicketKit.create({ dbPath });
  
  console.log('🎫 ticket.api REST API');
  console.log('─'.repeat(40));
  console.log(`📂 Database: ${dbPath}`);
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log('');
    console.log('Endpoints:');
    console.log('  GET    /boards              - List all boards');
    console.log('  POST   /boards              - Create a board');
    console.log('  GET    /boards/:id/kanban   - Get Kanban view');
    console.log('  POST   /boards/:id/tickets  - Create a ticket');
    console.log('  POST   /tickets/:id/move    - Move ticket');
    console.log('  ...and more (see README)');
    console.log('');
    console.log('Try it:');
    console.log(`  curl http://localhost:${PORT}/boards`);
  });
}

start().catch(console.error);
