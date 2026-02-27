/**
 * TicketKit - A simple, flexible ticket/task management SDK
 * Build your own Trello, Asana, Jira, or Zendesk
 * 
 * MIT License
 */

const initSqlJs = require('sql.js');
const { v4: uuidv4 } = require('uuid');
const { nanoid } = require('nanoid');

// ============================================================================
// CORE MODELS
// ============================================================================

/**
 * @typedef {Object} Ticket
 * @property {string} id
 * @property {string} board_id
 * @property {string} title
 * @property {string} description
 * @property {string} status
 * @property {string} priority - low, medium, high, urgent
 * @property {string[]} labels
 * @property {string[]} assignees
 * @property {string|null} parent_id - for subtasks/epics
 * @property {Object} custom_fields
 * @property {number} position - for ordering within status
 * @property {string|null} due_date
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Board
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} workflow_id
 * @property {string} created_at
 */

/**
 * @typedef {Object} Workflow
 * @property {string} id
 * @property {string} name
 * @property {string[]} states
 * @property {Object} transitions - { from_state: [allowed_to_states] }
 */

/**
 * @typedef {Object} Comment
 * @property {string} id
 * @property {string} ticket_id
 * @property {string} author
 * @property {string} content
 * @property {string|null} parent_id - for threaded replies
 * @property {string} created_at
 */

/**
 * @typedef {Object} Activity
 * @property {string} id
 * @property {string} ticket_id
 * @property {string} actor
 * @property {string} action - created, updated, status_changed, assigned, commented
 * @property {Object} changes - { field: { old, new } }
 * @property {string} created_at
 */

// ============================================================================
// DEFAULT WORKFLOWS
// ============================================================================

const WORKFLOWS = {
  kanban: {
    id: 'kanban',
    name: 'Kanban',
    states: ['backlog', 'todo', 'in_progress', 'review', 'done'],
    transitions: {
      backlog: ['todo'],
      todo: ['backlog', 'in_progress'],
      in_progress: ['todo', 'review'],
      review: ['in_progress', 'done'],
      done: ['review']
    }
  },
  scrum: {
    id: 'scrum',
    name: 'Scrum',
    states: ['backlog', 'sprint_backlog', 'in_progress', 'testing', 'done'],
    transitions: {
      backlog: ['sprint_backlog'],
      sprint_backlog: ['backlog', 'in_progress'],
      in_progress: ['sprint_backlog', 'testing'],
      testing: ['in_progress', 'done'],
      done: ['testing']
    }
  },
  support: {
    id: 'support',
    name: 'Support (Zendesk-style)',
    states: ['new', 'open', 'pending', 'on_hold', 'solved', 'closed'],
    transitions: {
      new: ['open'],
      open: ['pending', 'on_hold', 'solved'],
      pending: ['open', 'solved'],
      on_hold: ['open'],
      solved: ['open', 'closed'],
      closed: []
    }
  },
  simple: {
    id: 'simple',
    name: 'Simple (Trello-style)',
    states: ['todo', 'doing', 'done'],
    transitions: {
      todo: ['doing'],
      doing: ['todo', 'done'],
      done: ['doing']
    }
  }
};

// ============================================================================
// STORAGE ADAPTER INTERFACE
// ============================================================================

class StorageAdapter {
  async init() { throw new Error('Not implemented'); }
  async close() { throw new Error('Not implemented'); }
  
  // Boards
  async createBoard(board) { throw new Error('Not implemented'); }
  async getBoard(id) { throw new Error('Not implemented'); }
  async listBoards() { throw new Error('Not implemented'); }
  async updateBoard(id, updates) { throw new Error('Not implemented'); }
  async deleteBoard(id) { throw new Error('Not implemented'); }
  
  // Tickets
  async createTicket(ticket) { throw new Error('Not implemented'); }
  async getTicket(id) { throw new Error('Not implemented'); }
  async listTickets(query) { throw new Error('Not implemented'); }
  async updateTicket(id, updates) { throw new Error('Not implemented'); }
  async deleteTicket(id) { throw new Error('Not implemented'); }
  async bulkUpdateTickets(ids, updates) { throw new Error('Not implemented'); }
  
  // Comments
  async createComment(comment) { throw new Error('Not implemented'); }
  async listComments(ticketId) { throw new Error('Not implemented'); }
  async deleteComment(id) { throw new Error('Not implemented'); }
  
  // Activities
  async createActivity(activity) { throw new Error('Not implemented'); }
  async listActivities(ticketId, limit) { throw new Error('Not implemented'); }
  
  // Workflows
  async getWorkflow(id) { throw new Error('Not implemented'); }
  async createWorkflow(workflow) { throw new Error('Not implemented'); }

  // Attachments
  async createAttachment(attachment) { throw new Error('Not implemented'); }
  async getAttachment(id) { throw new Error('Not implemented'); }
  async listAttachments(ticketId) { throw new Error('Not implemented'); }
  async deleteAttachment(id) { throw new Error('Not implemented'); }
}

// ============================================================================
// SQLITE STORAGE ADAPTER
// ============================================================================

class SQLiteAdapter extends StorageAdapter {
  constructor(dbPath = ':memory:') {
    super();
    this.dbPath = dbPath;
    this.db = null;
  }

  async init() {
    const SQL = await initSqlJs();
    this.db = new SQL.Database();
    
    this.db.run(`
      CREATE TABLE IF NOT EXISTS boards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        workflow_id TEXT DEFAULT 'kanban',
        created_at TEXT DEFAULT (datetime('now'))
      );
      
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT DEFAULT 'backlog',
        priority TEXT DEFAULT 'medium',
        labels TEXT DEFAULT '[]',
        assignees TEXT DEFAULT '[]',
        parent_id TEXT,
        custom_fields TEXT DEFAULT '{}',
        position INTEGER DEFAULT 0,
        due_date TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        parent_id TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        changes TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        states TEXT NOT NULL,
        transitions TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS status_snapshots (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        snapshot_date TEXT NOT NULL,
        status TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
        UNIQUE(board_id, snapshot_date, status)
      );

      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        storage_path TEXT NOT NULL,
        uploaded_by TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_tickets_board ON tickets(board_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
      CREATE INDEX IF NOT EXISTS idx_tickets_assignees ON tickets(assignees);
      CREATE INDEX IF NOT EXISTS idx_comments_ticket ON comments(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_activities_ticket ON activities(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_snapshots_board_date ON status_snapshots(board_id, snapshot_date);
      CREATE INDEX IF NOT EXISTS idx_attachments_ticket ON attachments(ticket_id);
    `);

    // Insert default workflows
    for (const [id, wf] of Object.entries(WORKFLOWS)) {
      const stmt = this.db.prepare(
        'INSERT OR IGNORE INTO workflows (id, name, states, transitions) VALUES (?, ?, ?, ?)'
      );
      stmt.run([id, wf.name, JSON.stringify(wf.states), JSON.stringify(wf.transitions)]);
      stmt.free();
    }

    return this;
  }

  async close() {
    if (this.db) this.db.close();
  }

  // Export database to Uint8Array (for persistence)
  export() {
    return this.db.export();
  }

  // Import database from Uint8Array
  async import(data) {
    const SQL = await initSqlJs();
    this.db = new SQL.Database(data);
  }

  // Boards
  async createBoard(data) {
    const board = {
      id: data.id || nanoid(10),
      name: data.name,
      description: data.description || '',
      workflow_id: data.workflow_id || 'kanban',
      created_at: new Date().toISOString()
    };
    
    const stmt = this.db.prepare(
      'INSERT INTO boards (id, name, description, workflow_id, created_at) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run([board.id, board.name, board.description, board.workflow_id, board.created_at]);
    stmt.free();
    
    return board;
  }

  async getBoard(id) {
    const stmt = this.db.prepare('SELECT * FROM boards WHERE id = ?');
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  async listBoards() {
    const results = [];
    const stmt = this.db.prepare('SELECT * FROM boards ORDER BY created_at DESC');
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  async updateBoard(id, updates) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(updates)) {
      if (['name', 'description', 'workflow_id'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (fields.length === 0) return this.getBoard(id);
    
    values.push(id);
    this.db.run(`UPDATE boards SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.getBoard(id);
  }

  async deleteBoard(id) {
    this.db.run('DELETE FROM boards WHERE id = ?', [id]);
  }

  // Tickets
  async createTicket(data) {
    const ticket = {
      id: data.id || nanoid(10),
      board_id: data.board_id,
      title: data.title,
      description: data.description || '',
      status: data.status || 'backlog',
      priority: data.priority || 'medium',
      labels: JSON.stringify(data.labels || []),
      assignees: JSON.stringify(data.assignees || []),
      parent_id: data.parent_id || null,
      custom_fields: JSON.stringify(data.custom_fields || {}),
      position: data.position || 0,
      due_date: data.due_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const stmt = this.db.prepare(`
      INSERT INTO tickets (id, board_id, title, description, status, priority, labels, assignees, parent_id, custom_fields, position, due_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      ticket.id, ticket.board_id, ticket.title, ticket.description, ticket.status,
      ticket.priority, ticket.labels, ticket.assignees, ticket.parent_id,
      ticket.custom_fields, ticket.position, ticket.due_date, ticket.created_at, ticket.updated_at
    ]);
    stmt.free();
    
    return this._parseTicket(ticket);
  }

  _parseTicket(row) {
    return {
      ...row,
      labels: typeof row.labels === 'string' ? JSON.parse(row.labels) : row.labels,
      assignees: typeof row.assignees === 'string' ? JSON.parse(row.assignees) : row.assignees,
      custom_fields: typeof row.custom_fields === 'string' ? JSON.parse(row.custom_fields) : row.custom_fields
    };
  }

  async getTicket(id) {
    const stmt = this.db.prepare('SELECT * FROM tickets WHERE id = ?');
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return this._parseTicket(row);
    }
    stmt.free();
    return null;
  }

  async listTickets(query = {}) {
    let sql = 'SELECT * FROM tickets WHERE 1=1';
    const params = [];
    
    if (query.board_id) {
      sql += ' AND board_id = ?';
      params.push(query.board_id);
    }
    if (query.status) {
      sql += ' AND status = ?';
      params.push(query.status);
    }
    if (query.priority) {
      sql += ' AND priority = ?';
      params.push(query.priority);
    }
    if (query.assignee) {
      sql += ' AND assignees LIKE ?';
      params.push(`%"${query.assignee}"%`);
    }
    if (query.label) {
      sql += ' AND labels LIKE ?';
      params.push(`%"${query.label}"%`);
    }
    if (query.parent_id !== undefined) {
      if (query.parent_id === null) {
        sql += ' AND parent_id IS NULL';
      } else {
        sql += ' AND parent_id = ?';
        params.push(query.parent_id);
      }
    }
    if (query.search) {
      sql += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${query.search}%`, `%${query.search}%`);
    }
    
    sql += ' ORDER BY position ASC, created_at DESC';
    
    if (query.limit) {
      sql += ' LIMIT ?';
      params.push(query.limit);
    }
    if (query.offset) {
      sql += ' OFFSET ?';
      params.push(query.offset);
    }
    
    const results = [];
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    while (stmt.step()) {
      results.push(this._parseTicket(stmt.getAsObject()));
    }
    stmt.free();
    return results;
  }

  async updateTicket(id, updates) {
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (['title', 'description', 'status', 'priority', 'parent_id', 'position', 'due_date'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      } else if (['labels', 'assignees', 'custom_fields'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(JSON.stringify(value));
      }
    }
    
    if (fields.length === 0) return this.getTicket(id);
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    this.db.run(`UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.getTicket(id);
  }

  async deleteTicket(id) {
    this.db.run('DELETE FROM tickets WHERE id = ?', [id]);
  }

  async bulkUpdateTickets(ids, updates) {
    const results = [];
    for (const id of ids) {
      results.push(await this.updateTicket(id, updates));
    }
    return results;
  }

  // Comments
  async createComment(data) {
    const comment = {
      id: data.id || nanoid(10),
      ticket_id: data.ticket_id,
      author: data.author,
      content: data.content,
      parent_id: data.parent_id || null,
      created_at: new Date().toISOString()
    };
    
    const stmt = this.db.prepare(
      'INSERT INTO comments (id, ticket_id, author, content, parent_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run([comment.id, comment.ticket_id, comment.author, comment.content, comment.parent_id, comment.created_at]);
    stmt.free();
    
    return comment;
  }

  async listComments(ticketId) {
    const results = [];
    const stmt = this.db.prepare('SELECT * FROM comments WHERE ticket_id = ? ORDER BY created_at ASC');
    stmt.bind([ticketId]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  async deleteComment(id) {
    this.db.run('DELETE FROM comments WHERE id = ?', [id]);
  }

  // Activities
  async createActivity(data) {
    const activity = {
      id: data.id || nanoid(10),
      ticket_id: data.ticket_id,
      actor: data.actor,
      action: data.action,
      changes: JSON.stringify(data.changes || {}),
      created_at: new Date().toISOString()
    };
    
    const stmt = this.db.prepare(
      'INSERT INTO activities (id, ticket_id, actor, action, changes, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run([activity.id, activity.ticket_id, activity.actor, activity.action, activity.changes, activity.created_at]);
    stmt.free();
    
    return {
      ...activity,
      changes: JSON.parse(activity.changes)
    };
  }

  async listActivities(ticketId, limit = 50) {
    const results = [];
    const stmt = this.db.prepare(
      'SELECT * FROM activities WHERE ticket_id = ? ORDER BY created_at DESC LIMIT ?'
    );
    stmt.bind([ticketId, limit]);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        ...row,
        changes: JSON.parse(row.changes)
      });
    }
    stmt.free();
    return results;
  }

  async queryActivity(boardId, opts = {}) {
    const { from, to, actors, actions, limit } = opts;
    let sql = `SELECT a.* FROM activities a
               INNER JOIN tickets t ON a.ticket_id = t.id
               WHERE t.board_id = ?`;
    const params = [boardId];

    if (from) {
      sql += ' AND a.created_at >= ?';
      params.push(from);
    }

    if (to) {
      sql += ' AND a.created_at <= ?';
      params.push(to);
    }

    if (actors && actors.length > 0) {
      sql += ` AND a.actor IN (${actors.map(() => '?').join(',')})`;
      params.push(...actors);
    }

    if (actions && actions.length > 0) {
      sql += ` AND a.action IN (${actions.map(() => '?').join(',')})`;
      params.push(...actions);
    }

    sql += ' ORDER BY a.created_at DESC';

    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }

    const results = [];
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        ...row,
        changes: JSON.parse(row.changes)
      });
    }
    stmt.free();
    return results;
  }

  // Workflows
  async getWorkflow(id) {
    const stmt = this.db.prepare('SELECT * FROM workflows WHERE id = ?');
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return {
        ...row,
        states: JSON.parse(row.states),
        transitions: JSON.parse(row.transitions)
      };
    }
    stmt.free();
    return WORKFLOWS[id] || null;
  }

  async createWorkflow(data) {
    const workflow = {
      id: data.id || nanoid(10),
      name: data.name,
      states: JSON.stringify(data.states),
      transitions: JSON.stringify(data.transitions)
    };
    
    const stmt = this.db.prepare(
      'INSERT OR REPLACE INTO workflows (id, name, states, transitions) VALUES (?, ?, ?, ?)'
    );
    stmt.run([workflow.id, workflow.name, workflow.states, workflow.transitions]);
    stmt.free();
    
    return {
      ...workflow,
      states: data.states,
      transitions: data.transitions
    };
  }

  // Attachments
  async createAttachment(data) {
    const attachment = {
      id: data.id || nanoid(10),
      ticket_id: data.ticket_id,
      filename: data.filename,
      original_filename: data.original_filename,
      mime_type: data.mime_type,
      size_bytes: data.size_bytes,
      storage_path: data.storage_path,
      uploaded_by: data.uploaded_by,
      created_at: new Date().toISOString()
    };

    const stmt = this.db.prepare(
      'INSERT INTO attachments (id, ticket_id, filename, original_filename, mime_type, size_bytes, storage_path, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run([
      attachment.id,
      attachment.ticket_id,
      attachment.filename,
      attachment.original_filename,
      attachment.mime_type,
      attachment.size_bytes,
      attachment.storage_path,
      attachment.uploaded_by,
      attachment.created_at
    ]);
    stmt.free();

    return attachment;
  }

  async getAttachment(id) {
    const stmt = this.db.prepare('SELECT * FROM attachments WHERE id = ?');
    stmt.bind([id]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  }

  async listAttachments(ticketId) {
    const stmt = this.db.prepare('SELECT * FROM attachments WHERE ticket_id = ? ORDER BY created_at DESC');
    stmt.bind([ticketId]);

    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();

    return results;
  }

  async deleteAttachment(id) {
    const stmt = this.db.prepare('DELETE FROM attachments WHERE id = ?');
    stmt.run([id]);
    stmt.free();
  }

  async takeSnapshot(boardId, date = null) {
    const snapshotDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Get board to validate and get workflow
    const board = await this.getBoard(boardId);
    if (!board) throw new Error(`Board ${boardId} not found`);

    const workflow = await this.getWorkflow(board.workflow_id);

    // Count tickets per status
    const snapshots = [];
    for (const status of workflow.states) {
      const stmt = this.db.prepare(
        'SELECT COUNT(*) as count FROM tickets WHERE board_id = ? AND status = ?'
      );
      stmt.bind([boardId, status]);
      let count = 0;
      if (stmt.step()) {
        count = stmt.getAsObject().count;
      }
      stmt.free();

      // Insert or replace snapshot
      const id = nanoid(10);
      const insertStmt = this.db.prepare(
        'INSERT OR REPLACE INTO status_snapshots (id, board_id, snapshot_date, status, count) VALUES (?, ?, ?, ?, ?)'
      );
      insertStmt.run([id, boardId, snapshotDate, status, count]);
      insertStmt.free();

      snapshots.push({ id, board_id: boardId, snapshot_date: snapshotDate, status, count });
    }

    return snapshots;
  }

  async getCFDData(boardId, options = {}) {
    const { from, to } = options;

    let sql = 'SELECT snapshot_date, status, count FROM status_snapshots WHERE board_id = ?';
    const params = [boardId];

    if (from) {
      sql += ' AND snapshot_date >= ?';
      params.push(from);
    }
    if (to) {
      sql += ' AND snapshot_date <= ?';
      params.push(to);
    }

    sql += ' ORDER BY snapshot_date ASC, status ASC';

    const results = [];
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();

    // Group by date for easier frontend consumption
    const grouped = {};
    for (const row of results) {
      if (!grouped[row.snapshot_date]) {
        grouped[row.snapshot_date] = { date: row.snapshot_date };
      }
      grouped[row.snapshot_date][row.status] = row.count;
    }

    return Object.values(grouped);
  }

  async backfillSnapshots(boardId, options = {}) {
    const { from, to } = options;

    // Get board and workflow
    const board = await this.getBoard(boardId);
    if (!board) throw new Error(`Board ${boardId} not found`);

    const workflow = await this.getWorkflow(board.workflow_id);

    // Get all status change activities for this board's tickets
    let sql = `
      SELECT a.created_at, a.changes, t.status as current_status
      FROM activities a
      JOIN tickets t ON a.ticket_id = t.id
      WHERE t.board_id = ? AND a.action = 'status_changed'
    `;
    const params = [boardId];

    if (from) {
      sql += ' AND date(a.created_at) >= ?';
      params.push(from);
    }
    if (to) {
      sql += ' AND date(a.created_at) <= ?';
      params.push(to);
    }

    sql += ' ORDER BY a.created_at ASC';

    // For simplicity, we'll take snapshots for each unique date in the activity log
    const dates = new Set();
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const date = row.created_at.split('T')[0];
      dates.add(date);
    }
    stmt.free();

    // Take snapshot for each date
    const results = [];
    for (const date of Array.from(dates).sort()) {
      const snapshots = await this.takeSnapshot(boardId, date);
      results.push(...snapshots);
    }

    return results;
  }
}

// ============================================================================
// POSTGRESQL STORAGE ADAPTER
// ============================================================================

class PostgreSQLAdapter extends StorageAdapter {
  constructor(connectionString) {
    super();
    this.connectionString = connectionString;
    this.pool = null;
  }

  async init() {
    const { Pool } = require('pg');
    // Enable SSL for cloud databases (detected by sslmode parameter or cloud host)
    const needsSSL = this.connectionString.includes('sslmode=require') ||
                     this.connectionString.includes('.supabase.com') ||
                     this.connectionString.includes('.amazonaws.com');

    // Remove problematic query parameters from connection string
    let connString = this.connectionString;
    if (needsSSL && connString.includes('?')) {
      const [baseUrl, queryString] = connString.split('?');
      const params = new URLSearchParams(queryString);

      // Remove problematic parameters
      params.delete('sslmode');
      params.delete('supa');

      // Reconstruct connection string
      const remainingParams = params.toString();
      connString = remainingParams ? `${baseUrl}?${remainingParams}` : baseUrl;
    }

    this.pool = new Pool({
      connectionString: connString,
      ssl: needsSSL ? { rejectUnauthorized: false } : false
    });

    // Create tables
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS boards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        workflow_id TEXT DEFAULT 'kanban',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT DEFAULT 'backlog',
        priority TEXT DEFAULT 'medium',
        labels JSONB DEFAULT '[]',
        assignees JSONB DEFAULT '[]',
        parent_id TEXT,
        custom_fields JSONB DEFAULT '{}',
        position INTEGER DEFAULT 0,
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        parent_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        board_id TEXT NOT NULL,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        changes JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        storage_path TEXT NOT NULL,
        uploaded_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        states JSONB NOT NULL,
        transitions JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS status_snapshots (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        snapshot_date DATE NOT NULL,
        status TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
        UNIQUE(board_id, snapshot_date, status)
      );
    `);

    // Create indexes
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tickets_board ON tickets(board_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
      CREATE INDEX IF NOT EXISTS idx_comments_ticket ON comments(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_activities_ticket ON activities(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_activities_board_date ON activities(board_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_attachments_ticket ON attachments(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_snapshots_board_date ON status_snapshots(board_id, snapshot_date);
    `);

    // Insert default workflows
    for (const [id, wf] of Object.entries(WORKFLOWS)) {
      await this.pool.query(
        `INSERT INTO workflows (id, name, states, transitions)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [id, wf.name, JSON.stringify(wf.states), JSON.stringify(wf.transitions)]
      );
    }

    return this;
  }

  async close() {
    if (this.pool) await this.pool.end();
  }

  // Boards
  async createBoard(data) {
    const board = {
      id: data.id || nanoid(10),
      name: data.name,
      description: data.description || '',
      workflow_id: data.workflow_id || 'kanban',
      created_at: new Date().toISOString()
    };

    await this.pool.query(
      'INSERT INTO boards (id, name, description, workflow_id, created_at) VALUES ($1, $2, $3, $4, $5)',
      [board.id, board.name, board.description, board.workflow_id, board.created_at]
    );

    return board;
  }

  async getBoard(id) {
    const result = await this.pool.query('SELECT * FROM boards WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async listBoards() {
    const result = await this.pool.query('SELECT * FROM boards ORDER BY created_at DESC');
    return result.rows;
  }

  async updateBoard(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (['name', 'description', 'workflow_id'].includes(key)) {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    }
    if (fields.length === 0) return this.getBoard(id);

    values.push(id);
    await this.pool.query(`UPDATE boards SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);
    return this.getBoard(id);
  }

  async deleteBoard(id) {
    await this.pool.query('DELETE FROM boards WHERE id = $1', [id]);
  }

  // Tickets
  async createTicket(data) {
    const ticket = {
      id: data.id || nanoid(10),
      board_id: data.board_id,
      title: data.title,
      description: data.description || '',
      status: data.status || 'backlog',
      priority: data.priority || 'medium',
      labels: data.labels || [],
      assignees: data.assignees || [],
      parent_id: data.parent_id || null,
      custom_fields: data.custom_fields || {},
      position: data.position || 0,
      due_date: data.due_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await this.pool.query(`
      INSERT INTO tickets (id, board_id, title, description, status, priority, labels, assignees, parent_id, custom_fields, position, due_date, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      ticket.id, ticket.board_id, ticket.title, ticket.description, ticket.status,
      ticket.priority, JSON.stringify(ticket.labels), JSON.stringify(ticket.assignees),
      ticket.parent_id, JSON.stringify(ticket.custom_fields), ticket.position,
      ticket.due_date, ticket.created_at, ticket.updated_at
    ]);

    return ticket;
  }

  async getTicket(id) {
    const result = await this.pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    return result.rows[0] ? this._parseTicket(result.rows[0]) : null;
  }

  _parseTicket(row) {
    return {
      ...row,
      labels: typeof row.labels === 'string' ? JSON.parse(row.labels) : row.labels,
      assignees: typeof row.assignees === 'string' ? JSON.parse(row.assignees) : row.assignees,
      custom_fields: typeof row.custom_fields === 'string' ? JSON.parse(row.custom_fields) : row.custom_fields
    };
  }

  async listTickets(query = {}) {
    let sql = 'SELECT * FROM tickets WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (query.board_id) {
      sql += ` AND board_id = $${paramIndex++}`;
      params.push(query.board_id);
    }
    if (query.status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(query.status);
    }
    if (query.priority) {
      sql += ` AND priority = $${paramIndex++}`;
      params.push(query.priority);
    }
    if (query.assignee) {
      sql += ` AND assignees::jsonb @> $${paramIndex++}::jsonb`;
      params.push(JSON.stringify([query.assignee]));
    }
    if (query.label) {
      sql += ` AND labels::jsonb @> $${paramIndex++}::jsonb`;
      params.push(JSON.stringify([query.label]));
    }
    if (query.parent_id !== undefined) {
      if (query.parent_id === null) {
        sql += ' AND parent_id IS NULL';
      } else {
        sql += ` AND parent_id = $${paramIndex++}`;
        params.push(query.parent_id);
      }
    }
    if (query.search) {
      sql += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${query.search}%`);
      paramIndex++;
    }

    sql += ' ORDER BY position ASC, created_at DESC';

    if (query.limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(query.limit);
    }
    if (query.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(query.offset);
    }

    const result = await this.pool.query(sql, params);
    return result.rows.map(row => this._parseTicket(row));
  }

  async updateTicket(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['title', 'description', 'status', 'priority', 'labels', 'assignees',
                           'parent_id', 'custom_fields', 'position', 'due_date'];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (['labels', 'assignees', 'custom_fields'].includes(key)) {
          fields.push(`${key} = $${paramIndex++}::jsonb`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramIndex++}`);
          values.push(value);
        }
      }
    }

    if (fields.length === 0) return this.getTicket(id);

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date().toISOString());
    values.push(id);

    await this.pool.query(
      `UPDATE tickets SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    return this.getTicket(id);
  }

  async deleteTicket(id) {
    await this.pool.query('DELETE FROM tickets WHERE id = $1', [id]);
  }

  async bulkUpdateTickets(ids, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['status', 'priority', 'position'];
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return;

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date().toISOString());
    values.push(ids);

    await this.pool.query(
      `UPDATE tickets SET ${fields.join(', ')} WHERE id = ANY($${paramIndex})`,
      values
    );
  }

  // Comments
  async createComment(data) {
    const comment = {
      id: data.id || nanoid(10),
      ticket_id: data.ticket_id,
      author: data.author,
      content: data.content,
      parent_id: data.parent_id || null,
      created_at: new Date().toISOString()
    };

    await this.pool.query(
      'INSERT INTO comments (id, ticket_id, author, content, parent_id, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [comment.id, comment.ticket_id, comment.author, comment.content, comment.parent_id, comment.created_at]
    );

    return comment;
  }

  async listComments(ticketId) {
    const result = await this.pool.query(
      'SELECT * FROM comments WHERE ticket_id = $1 ORDER BY created_at ASC',
      [ticketId]
    );
    return result.rows;
  }

  async deleteComment(id) {
    await this.pool.query('DELETE FROM comments WHERE id = $1', [id]);
  }

  // Activities
  async createActivity(data) {
    // Get board_id from ticket
    const ticketResult = await this.pool.query(
      'SELECT board_id FROM tickets WHERE id = $1',
      [data.ticket_id]
    );

    if (!ticketResult.rows[0]) {
      throw new Error(`Ticket ${data.ticket_id} not found`);
    }

    const board_id = ticketResult.rows[0].board_id;

    const activity = {
      id: data.id || nanoid(10),
      ticket_id: data.ticket_id,
      board_id: board_id,
      actor: data.actor,
      action: data.action,
      changes: data.changes || {},
      created_at: new Date().toISOString()
    };

    await this.pool.query(
      'INSERT INTO activities (id, ticket_id, board_id, actor, action, changes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [activity.id, activity.ticket_id, activity.board_id, activity.actor, activity.action,
       JSON.stringify(activity.changes), activity.created_at]
    );

    return activity;
  }

  async listActivities(ticketId, limit = 50) {
    const result = await this.pool.query(
      'SELECT * FROM activities WHERE ticket_id = $1 ORDER BY created_at DESC LIMIT $2',
      [ticketId, limit]
    );
    return result.rows.map(row => ({
      ...row,
      changes: typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes
    }));
  }

  async queryActivity(boardId, opts = {}) {
    const { from, to, actors, actions, limit } = opts;
    let sql = 'SELECT * FROM activities WHERE board_id = $1';
    const params = [boardId];
    let paramIndex = 2;

    if (from) {
      sql += ` AND created_at >= $${paramIndex++}`;
      params.push(from);
    }

    if (to) {
      sql += ` AND created_at <= $${paramIndex++}`;
      params.push(to);
    }

    if (actors && actors.length > 0) {
      sql += ` AND actor = ANY($${paramIndex++})`;
      params.push(actors);
    }

    if (actions && actions.length > 0) {
      sql += ` AND action = ANY($${paramIndex++})`;
      params.push(actions);
    }

    sql += ' ORDER BY created_at DESC';

    if (limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(limit);
    }

    const result = await this.pool.query(sql, params);
    return result.rows.map(row => ({
      ...row,
      changes: typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes
    }));
  }

  // Workflows
  async getWorkflow(id) {
    const result = await this.pool.query('SELECT * FROM workflows WHERE id = $1', [id]);
    if (result.rows[0]) {
      const row = result.rows[0];
      return {
        ...row,
        states: typeof row.states === 'string' ? JSON.parse(row.states) : row.states,
        transitions: typeof row.transitions === 'string' ? JSON.parse(row.transitions) : row.transitions
      };
    }
    return WORKFLOWS[id] || null;
  }

  async createWorkflow(data) {
    const workflow = {
      id: data.id || nanoid(10),
      name: data.name,
      states: data.states,
      transitions: data.transitions
    };

    await this.pool.query(
      `INSERT INTO workflows (id, name, states, transitions)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET name = $2, states = $3, transitions = $4`,
      [workflow.id, workflow.name, JSON.stringify(workflow.states), JSON.stringify(workflow.transitions)]
    );

    return workflow;
  }

  // Attachments
  async createAttachment(data) {
    const attachment = {
      id: data.id || nanoid(10),
      ticket_id: data.ticket_id,
      filename: data.filename,
      original_filename: data.original_filename,
      mime_type: data.mime_type,
      size_bytes: data.size_bytes,
      storage_path: data.storage_path,
      uploaded_by: data.uploaded_by,
      created_at: new Date().toISOString()
    };

    await this.pool.query(
      'INSERT INTO attachments (id, ticket_id, filename, original_filename, mime_type, size_bytes, storage_path, uploaded_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [attachment.id, attachment.ticket_id, attachment.filename, attachment.original_filename,
       attachment.mime_type, attachment.size_bytes, attachment.storage_path, attachment.uploaded_by, attachment.created_at]
    );

    return attachment;
  }

  async getAttachment(id) {
    const result = await this.pool.query('SELECT * FROM attachments WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async listAttachments(ticketId) {
    const result = await this.pool.query(
      'SELECT * FROM attachments WHERE ticket_id = $1 ORDER BY created_at DESC',
      [ticketId]
    );
    return result.rows;
  }

  async deleteAttachment(id) {
    await this.pool.query('DELETE FROM attachments WHERE id = $1', [id]);
  }

  async takeSnapshot(boardId, date = null) {
    const snapshotDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Get board to validate and get workflow
    const board = await this.getBoard(boardId);
    if (!board) throw new Error(`Board ${boardId} not found`);

    const workflow = await this.getWorkflow(board.workflow_id);

    // Count tickets per status
    const snapshots = [];
    for (const status of workflow.states) {
      const result = await this.pool.query(
        'SELECT COUNT(*) as count FROM tickets WHERE board_id = $1 AND status = $2',
        [boardId, status]
      );
      const count = parseInt(result.rows[0].count);

      // Insert or update snapshot
      const id = nanoid(10);
      await this.pool.query(
        `INSERT INTO status_snapshots (id, board_id, snapshot_date, status, count)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (board_id, snapshot_date, status)
         DO UPDATE SET count = $5`,
        [id, boardId, snapshotDate, status, count]
      );

      snapshots.push({ id, board_id: boardId, snapshot_date: snapshotDate, status, count });
    }

    return snapshots;
  }

  async getCFDData(boardId, options = {}) {
    const { from, to } = options;

    let sql = 'SELECT snapshot_date, status, count FROM status_snapshots WHERE board_id = $1';
    const params = [boardId];
    let paramIndex = 2;

    if (from) {
      sql += ` AND snapshot_date >= $${paramIndex++}`;
      params.push(from);
    }
    if (to) {
      sql += ` AND snapshot_date <= $${paramIndex++}`;
      params.push(to);
    }

    sql += ' ORDER BY snapshot_date ASC, status ASC';

    const result = await this.pool.query(sql, params);

    // Group by date for easier frontend consumption
    const grouped = {};
    for (const row of result.rows) {
      const dateStr = row.snapshot_date instanceof Date
        ? row.snapshot_date.toISOString().split('T')[0]
        : row.snapshot_date;

      if (!grouped[dateStr]) {
        grouped[dateStr] = { date: dateStr };
      }
      grouped[dateStr][row.status] = row.count;
    }

    return Object.values(grouped);
  }

  async backfillSnapshots(boardId, options = {}) {
    const { from, to } = options;

    // Get board and workflow
    const board = await this.getBoard(boardId);
    if (!board) throw new Error(`Board ${boardId} not found`);

    const workflow = await this.getWorkflow(board.workflow_id);

    // Get all unique dates from activity log
    let sql = `
      SELECT DISTINCT DATE(a.created_at) as activity_date
      FROM activities a
      JOIN tickets t ON a.ticket_id = t.id
      WHERE t.board_id = $1 AND a.action = 'status_changed'
    `;
    const params = [boardId];
    let paramIndex = 2;

    if (from) {
      sql += ` AND DATE(a.created_at) >= $${paramIndex++}`;
      params.push(from);
    }
    if (to) {
      sql += ` AND DATE(a.created_at) <= $${paramIndex++}`;
      params.push(to);
    }

    sql += ' ORDER BY activity_date ASC';

    const result = await this.pool.query(sql, params);

    // Take snapshot for each date
    const results = [];
    for (const row of result.rows) {
      const dateStr = row.activity_date instanceof Date
        ? row.activity_date.toISOString().split('T')[0]
        : row.activity_date;
      const snapshots = await this.takeSnapshot(boardId, dateStr);
      results.push(...snapshots);
    }

    return results;
  }
}

// ============================================================================
// TICKETKIT MAIN CLASS
// ============================================================================

class TicketKit {
  constructor(storage) {
    this.storage = storage;
    this.eventHandlers = new Map();
  }

  static async create(options = {}) {
    const storage = options.storage || new SQLiteAdapter(options.dbPath || ':memory:');
    await storage.init();
    return new TicketKit(storage);
  }

  // Event system
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    for (const handler of handlers) {
      handler(data);
    }
  }

  // Board operations
  async createBoard(data) {
    const board = await this.storage.createBoard(data);
    this.emit('board:created', board);
    return board;
  }

  async getBoard(id) {
    return this.storage.getBoard(id);
  }

  async listBoards() {
    return this.storage.listBoards();
  }

  async updateBoard(id, updates) {
    const board = await this.storage.updateBoard(id, updates);
    this.emit('board:updated', board);
    return board;
  }

  async deleteBoard(id) {
    await this.storage.deleteBoard(id);
    this.emit('board:deleted', { id });
  }

  // Ticket operations
  async createTicket(data, actor = 'system') {
    const board = await this.storage.getBoard(data.board_id);
    if (!board) throw new Error(`Board ${data.board_id} not found`);
    
    const workflow = await this.storage.getWorkflow(board.workflow_id);
    if (!data.status) {
      data.status = workflow.states[0];
    }
    
    const ticket = await this.storage.createTicket(data);
    
    await this.storage.createActivity({
      ticket_id: ticket.id,
      actor,
      action: 'created',
      changes: { ticket }
    });
    
    this.emit('ticket:created', ticket);
    return ticket;
  }

  async getTicket(id) {
    return this.storage.getTicket(id);
  }

  async listTickets(query = {}) {
    // Support both listTickets(boardId) and listTickets({ board_id: boardId, ... })
    if (typeof query === 'string') {
      query = { board_id: query };
    }
    return this.storage.listTickets(query);
  }

  async updateTicket(id, updates, actor = 'system') {
    const oldTicket = await this.storage.getTicket(id);
    if (!oldTicket) throw new Error(`Ticket ${id} not found`);
    
    // Validate status transition if status is being changed
    if (updates.status && updates.status !== oldTicket.status) {
      const board = await this.storage.getBoard(oldTicket.board_id);
      const workflow = await this.storage.getWorkflow(board.workflow_id);
      
      const allowedTransitions = workflow.transitions[oldTicket.status] || [];
      if (!allowedTransitions.includes(updates.status)) {
        throw new Error(
          `Invalid status transition: ${oldTicket.status} -> ${updates.status}. ` +
          `Allowed: ${allowedTransitions.join(', ') || 'none'}`
        );
      }
    }
    
    const ticket = await this.storage.updateTicket(id, updates);
    
    // Track changes
    const changes = {};
    for (const key of Object.keys(updates)) {
      if (JSON.stringify(oldTicket[key]) !== JSON.stringify(ticket[key])) {
        changes[key] = { old: oldTicket[key], new: ticket[key] };
      }
    }
    
    if (Object.keys(changes).length > 0) {
      const action = changes.status ? 'status_changed' : 'updated';
      await this.storage.createActivity({
        ticket_id: id,
        actor,
        action,
        changes
      });
      
      this.emit('ticket:updated', { ticket, changes });
    }
    
    return ticket;
  }

  async deleteTicket(id, actor = 'system') {
    const ticket = await this.storage.getTicket(id);
    if (!ticket) throw new Error(`Ticket ${id} not found`);
    
    await this.storage.deleteTicket(id);
    this.emit('ticket:deleted', { id, ticket });
  }

  // Bulk operations
  async bulkUpdateTickets(ids, updates, actor = 'system') {
    const results = [];
    for (const id of ids) {
      results.push(await this.updateTicket(id, updates, actor));
    }
    return results;
  }

  async moveTicket(id, newStatus, actor = 'system') {
    return this.updateTicket(id, { status: newStatus }, actor);
  }

  async assignTicket(id, assignees, actor = 'system') {
    const ticket = await this.updateTicket(id, { assignees }, actor);
    
    await this.storage.createActivity({
      ticket_id: id,
      actor,
      action: 'assigned',
      changes: { assignees }
    });
    
    return ticket;
  }

  // Comment operations
  async addComment(ticketId, content, author) {
    const comment = await this.storage.createComment({
      ticket_id: ticketId,
      author,
      content
    });
    
    await this.storage.createActivity({
      ticket_id: ticketId,
      actor: author,
      action: 'commented',
      changes: { comment_id: comment.id }
    });
    
    this.emit('comment:created', comment);
    return comment;
  }

  async replyToComment(ticketId, parentId, content, author) {
    const comment = await this.storage.createComment({
      ticket_id: ticketId,
      author,
      content,
      parent_id: parentId
    });
    
    this.emit('comment:created', comment);
    return comment;
  }

  async listComments(ticketId) {
    return this.storage.listComments(ticketId);
  }

  // Activity feed
  async getActivity(ticketId, limit = 50) {
    return this.storage.listActivities(ticketId, limit);
  }

  // Workflow operations
  async getWorkflow(id) {
    return this.storage.getWorkflow(id);
  }

  async createWorkflow(data) {
    return this.storage.createWorkflow(data);
  }

  // Attachments
  async createAttachment(data, actor = 'system') {
    const attachment = await this.storage.createAttachment(data);

    const ticket = await this.storage.getTicket(data.ticket_id);
    if (ticket) {
      await this.storage.createActivity({
        ticket_id: data.ticket_id,
        board_id: ticket.board_id,
        actor,
        action: 'attachment_added',
        changes: { attachment_id: attachment.id, filename: data.original_filename }
      });
    }

    this.emit('attachment:created', attachment);
    return attachment;
  }

  async getAttachment(id) {
    return this.storage.getAttachment(id);
  }

  async listAttachments(ticketId) {
    return this.storage.listAttachments(ticketId);
  }

  async deleteAttachment(id, actor = 'system') {
    const attachment = await this.storage.getAttachment(id);
    if (!attachment) throw new Error(`Attachment ${id} not found`);

    const ticket = await this.storage.getTicket(attachment.ticket_id);
    if (!ticket) throw new Error(`Ticket ${attachment.ticket_id} not found`);

    await this.storage.deleteAttachment(id);

    await this.storage.createActivity({
      ticket_id: attachment.ticket_id,
      board_id: ticket.board_id,
      actor,
      action: 'attachment_deleted',
      changes: { attachment_id: id, filename: attachment.original_filename }
    });

    this.emit('attachment:deleted', { id, attachment });
  }

  // Convenience wrapper for API endpoint
  async addAttachment(ticketId, fileData, uploadedBy) {
    const ticket = await this.storage.getTicket(ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    const attachment = await this.storage.createAttachment({
      ticket_id: ticketId,
      filename: fileData.filename,
      original_filename: fileData.original_filename,
      mime_type: fileData.mime_type,
      size_bytes: fileData.size_bytes,
      storage_path: fileData.storage_path,
      uploaded_by: uploadedBy
    });

    await this.storage.createActivity({
      ticket_id: ticketId,
      board_id: ticket.board_id,
      actor: uploadedBy,
      action: 'attachment_added',
      changes: { attachment_id: attachment.id, filename: fileData.original_filename }
    });

    this.emit('attachment:added', attachment);
    return attachment;
  }

  // View helpers (computed queries)
  async getKanbanView(boardId) {
    const board = await this.storage.getBoard(boardId);
    if (!board) throw new Error(`Board ${boardId} not found`);
    
    const workflow = await this.storage.getWorkflow(board.workflow_id);
    const tickets = await this.storage.listTickets({ board_id: boardId });
    
    const columns = {};
    for (const state of workflow.states) {
      columns[state] = tickets.filter(t => t.status === state);
    }
    
    return { board, workflow, columns };
  }

  async getBacklog(boardId) {
    const board = await this.storage.getBoard(boardId);
    if (!board) throw new Error(`Board ${boardId} not found`);
    
    const workflow = await this.storage.getWorkflow(board.workflow_id);
    const firstState = workflow.states[0];
    
    return this.storage.listTickets({ board_id: boardId, status: firstState });
  }

  // Subtasks
  async getSubtasks(parentId) {
    return this.storage.listTickets({ parent_id: parentId });
  }

  async createSubtask(parentId, data, actor = 'system') {
    const parent = await this.storage.getTicket(parentId);
    if (!parent) throw new Error(`Parent ticket ${parentId} not found`);
    
    return this.createTicket({
      ...data,
      board_id: parent.board_id,
      parent_id: parentId
    }, actor);
  }

  // Search with JQL-like syntax (simplified)
  async search(boardId, query) {
    // Simple query parser: "status:in_progress assignee:john priority:high label:bug"
    const params = { board_id: boardId };
    
    const parts = query.split(/\s+/);
    for (const part of parts) {
      const [key, value] = part.split(':');
      if (key && value) {
        if (key === 'status') params.status = value;
        else if (key === 'priority') params.priority = value;
        else if (key === 'assignee') params.assignee = value;
        else if (key === 'label') params.label = value;
        else params.search = part;
      } else {
        params.search = (params.search || '') + ' ' + part;
      }
    }
    
    if (params.search) params.search = params.search.trim();
    
    return this.storage.listTickets(params);
  }

  // Export/Import
  async export() {
    return {
      boards: await this.storage.listBoards(),
      tickets: await this.storage.listTickets({}),
      version: '1.0.0'
    };
  }

  async import(data) {
    for (const board of data.boards || []) {
      await this.storage.createBoard(board);
    }
    for (const ticket of data.tickets || []) {
      await this.storage.createTicket(ticket);
    }
  }

  // CFD (Cumulative Flow Diagram) Reports
  async takeSnapshot(boardId, date = null) {
    return this.storage.takeSnapshot(boardId, date);
  }

  async getCFDData(boardId, options = {}) {
    return this.storage.getCFDData(boardId, options);
  }

  async backfillSnapshots(boardId, options = {}) {
    return this.storage.backfillSnapshots(boardId, options);
  }

  // Activity Log Export
  async exportActivityLog(boardId, opts = {}) {
    const { format = 'json', timezone } = opts;
    const logs = await this.storage.queryActivity(boardId, opts);

    // Get ticket titles for the CSV
    const ticketIds = [...new Set(logs.map(l => l.ticket_id))];
    const tickets = {};
    for (const ticketId of ticketIds) {
      const ticket = await this.storage.getTicket(ticketId);
      if (ticket) tickets[ticketId] = ticket.title;
    }

    // Format timestamp with timezone
    const formatTimestamp = (timestamp) => {
      const date = new Date(timestamp);
      if (timezone) {
        try {
          return date.toLocaleString('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }) + ` (${timezone})`;
        } catch (err) {
          // Invalid timezone, fallback to UTC
          return date.toISOString().replace('T', ' ').replace('Z', ' UTC');
        }
      }
      // No timezone specified, use UTC
      return date.toISOString().replace('T', ' ').replace('Z', ' UTC');
    };

    if (format === 'csv') {
      // CSV format: timestamp,ticket_id,ticket_title,actor,action,details
      const rows = [['timestamp', 'ticket_id', 'ticket_title', 'actor', 'action', 'details']];

      for (const log of logs) {
        const details = this._formatActivityDetails(log);
        rows.push([
          formatTimestamp(log.created_at),
          log.ticket_id,
          tickets[log.ticket_id] || '',
          log.actor,
          log.action,
          details
        ]);
      }

      const csv = rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      return { data: csv, count: logs.length, format: 'csv' };
    }

    // JSON format
    const enrichedLogs = logs.map(log => ({
      ...log,
      created_at: formatTimestamp(log.created_at),
      ticket_title: tickets[log.ticket_id] || ''
    }));

    return { data: JSON.stringify(enrichedLogs, null, 2), count: logs.length, format: 'json' };
  }

  _formatActivityDetails(log) {
    const { action, changes } = log;

    if (action === 'status_changed' && changes.status) {
      return `${changes.status.old} → ${changes.status.new}`;
    }

    if (action === 'commented' && changes.comment_id) {
      return '';
    }

    if (action === 'attachment_added' && changes.filename) {
      return `Added: ${changes.filename}`;
    }

    if (action === 'attachment_deleted' && changes.filename) {
      return `Deleted: ${changes.filename}`;
    }

    if (action === 'created') {
      return '';
    }

    if (action === 'assigned' && changes.assignees) {
      return `Assigned to: ${changes.assignees.join(', ')}`;
    }

    return JSON.stringify(changes);
  }

  // Cleanup
  async close() {
    await this.storage.close();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  TicketKit,
  SQLiteAdapter,
  PostgreSQLAdapter,
  StorageAdapter,
  WORKFLOWS
};
