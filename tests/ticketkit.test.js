/**
 * TicketKit Unit Tests
 * Comprehensive test suite for TicketKit SDK
 */

const { TicketKit, WORKFLOWS, PostgreSQLAdapter } = require('../index.js');

describe('TicketKit Core', () => {
  let kit;

  beforeEach(async () => {
    kit = await TicketKit.create();
  });

  afterEach(() => {
    if (kit && kit.storage) {
      kit.storage.close();
    }
  });

  describe('Initialization', () => {
    test('should create TicketKit instance', async () => {
      expect(kit).toBeDefined();
      expect(kit.storage).toBeDefined();
    });

    test('should have default workflows available', () => {
      expect(WORKFLOWS).toBeDefined();
      expect(WORKFLOWS.kanban).toBeDefined();
      expect(WORKFLOWS.scrum).toBeDefined();
      expect(WORKFLOWS.support).toBeDefined();
      expect(WORKFLOWS.simple).toBeDefined();
    });
  });

  describe('Board Management', () => {
    test('should create a board', async () => {
      const board = await kit.createBoard({
        name: 'Test Board',
        description: 'A test board',
        workflow_id: 'kanban'
      });

      expect(board).toBeDefined();
      expect(board.id).toBeDefined();
      expect(board.name).toBe('Test Board');
      expect(board.description).toBe('A test board');
      expect(board.workflow_id).toBe('kanban');
      expect(board.created_at).toBeDefined();
    });

    test('should get a board by ID', async () => {
      const created = await kit.createBoard({ name: 'Test Board' });
      const retrieved = await kit.getBoard(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe('Test Board');
    });

    test('should list all boards', async () => {
      await kit.createBoard({ name: 'Board 1' });
      await kit.createBoard({ name: 'Board 2' });
      await kit.createBoard({ name: 'Board 3' });

      const boards = await kit.listBoards();
      expect(boards).toHaveLength(3);

      const names = boards.map(b => b.name);
      expect(names).toContain('Board 1');
      expect(names).toContain('Board 2');
      expect(names).toContain('Board 3');
    });

    test('should update a board', async () => {
      const board = await kit.createBoard({ name: 'Original Name' });

      await kit.updateBoard(board.id, {
        name: 'Updated Name',
        description: 'New description'
      });

      const updated = await kit.getBoard(board.id);
      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('New description');
    });

    test('should delete a board', async () => {
      const board = await kit.createBoard({ name: 'To Delete' });

      await kit.deleteBoard(board.id);

      const retrieved = await kit.getBoard(board.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Ticket Management', () => {
    let board;

    beforeEach(async () => {
      board = await kit.createBoard({ name: 'Test Board', workflow_id: 'kanban' });
    });

    test('should create a ticket', async () => {
      const ticket = await kit.createTicket({
        board_id: board.id,
        title: 'Test Ticket',
        description: 'Test description',
        priority: 'high',
        labels: ['bug', 'urgent']
      });

      expect(ticket).toBeDefined();
      expect(ticket.id).toBeDefined();
      expect(ticket.title).toBe('Test Ticket');
      expect(ticket.description).toBe('Test description');
      expect(ticket.priority).toBe('high');
      expect(ticket.labels).toEqual(['bug', 'urgent']);
      expect(ticket.status).toBe('backlog'); // Default for kanban
      expect(ticket.created_at).toBeDefined();
      expect(ticket.updated_at).toBeDefined();
    });

    test('should get a ticket by ID', async () => {
      const created = await kit.createTicket({
        board_id: board.id,
        title: 'Test Ticket'
      });

      const retrieved = await kit.getTicket(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.title).toBe('Test Ticket');
    });

    test('should list tickets', async () => {
      await kit.createTicket({ board_id: board.id, title: 'Ticket 1' });
      await kit.createTicket({ board_id: board.id, title: 'Ticket 2' });
      await kit.createTicket({ board_id: board.id, title: 'Ticket 3' });

      const tickets = await kit.listTickets({ board_id: board.id });
      expect(tickets.length).toBeGreaterThanOrEqual(3);
    });

    test('should update a ticket', async () => {
      const ticket = await kit.createTicket({
        board_id: board.id,
        title: 'Original Title'
      });

      await kit.updateTicket(ticket.id, {
        title: 'Updated Title',
        description: 'New description'
      });

      const updated = await kit.getTicket(ticket.id);
      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('New description');
    });

    test('should delete a ticket', async () => {
      const ticket = await kit.createTicket({
        board_id: board.id,
        title: 'To Delete'
      });

      await kit.deleteTicket(ticket.id);

      const retrieved = await kit.getTicket(ticket.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Workflow Transitions', () => {
    let board, ticket;

    beforeEach(async () => {
      board = await kit.createBoard({ name: 'Test Board', workflow_id: 'kanban' });
      ticket = await kit.createTicket({
        board_id: board.id,
        title: 'Test Ticket'
      });
    });

    test('should move ticket through valid workflow transitions', async () => {
      // backlog -> todo
      await kit.moveTicket(ticket.id, 'todo');
      let updated = await kit.getTicket(ticket.id);
      expect(updated.status).toBe('todo');

      // todo -> in_progress
      await kit.moveTicket(ticket.id, 'in_progress');
      updated = await kit.getTicket(ticket.id);
      expect(updated.status).toBe('in_progress');

      // in_progress -> review
      await kit.moveTicket(ticket.id, 'review');
      updated = await kit.getTicket(ticket.id);
      expect(updated.status).toBe('review');

      // review -> done
      await kit.moveTicket(ticket.id, 'done');
      updated = await kit.getTicket(ticket.id);
      expect(updated.status).toBe('done');
    });

    test('should reject invalid workflow transitions', async () => {
      // backlog cannot go directly to done
      await expect(kit.moveTicket(ticket.id, 'done'))
        .rejects.toThrow();
    });
  });

  describe('Assignees', () => {
    let board, ticket;

    beforeEach(async () => {
      board = await kit.createBoard({ name: 'Test Board' });
      ticket = await kit.createTicket({
        board_id: board.id,
        title: 'Test Ticket'
      });
    });

    test('should assign users to ticket', async () => {
      await kit.assignTicket(ticket.id, ['alice', 'bob']);

      const updated = await kit.getTicket(ticket.id);
      expect(updated.assignees).toEqual(['alice', 'bob']);
    });

    test('should replace assignees when assigning', async () => {
      await kit.assignTicket(ticket.id, ['alice', 'bob']);
      await kit.assignTicket(ticket.id, ['charlie']);

      const updated = await kit.getTicket(ticket.id);
      expect(updated.assignees).toEqual(['charlie']);
    });
  });

  describe('Comments', () => {
    let board, ticket;

    beforeEach(async () => {
      board = await kit.createBoard({ name: 'Test Board' });
      ticket = await kit.createTicket({
        board_id: board.id,
        title: 'Test Ticket'
      });
    });

    test('should add a comment to ticket', async () => {
      const comment = await kit.addComment(
        ticket.id,
        'This is a test comment',
        'alice'
      );

      expect(comment).toBeDefined();
      expect(comment.id).toBeDefined();
      expect(comment.ticket_id).toBe(ticket.id);
      expect(comment.content).toBe('This is a test comment');
      expect(comment.author).toBe('alice');
      expect(comment.created_at).toBeDefined();
    });

    test('should reply to a comment', async () => {
      const parent = await kit.addComment(
        ticket.id,
        'Parent comment',
        'alice'
      );

      const reply = await kit.replyToComment(
        ticket.id,
        parent.id,
        'Reply to parent',
        'bob'
      );

      expect(reply).toBeDefined();
      expect(reply.parent_id).toBe(parent.id);
      expect(reply.content).toBe('Reply to parent');
      expect(reply.author).toBe('bob');
    });

    test('should list all comments for a ticket', async () => {
      await kit.addComment(ticket.id, 'Comment 1', 'alice');
      await kit.addComment(ticket.id, 'Comment 2', 'bob');
      await kit.addComment(ticket.id, 'Comment 3', 'charlie');

      const comments = await kit.listComments(ticket.id);
      expect(comments.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Subtasks', () => {
    let board, ticket;

    beforeEach(async () => {
      board = await kit.createBoard({ name: 'Test Board' });
      ticket = await kit.createTicket({
        board_id: board.id,
        title: 'Parent Ticket'
      });
    });

    test('should create a subtask', async () => {
      const subtask = await kit.createSubtask(ticket.id, {
        title: 'Subtask 1'
      });

      expect(subtask).toBeDefined();
      expect(subtask.parent_id).toBe(ticket.id);
      expect(subtask.title).toBe('Subtask 1');
    });

    test('should list subtasks for a ticket', async () => {
      await kit.createSubtask(ticket.id, { title: 'Subtask 1' });
      await kit.createSubtask(ticket.id, { title: 'Subtask 2' });
      await kit.createSubtask(ticket.id, { title: 'Subtask 3' });

      const subtasks = await kit.getSubtasks(ticket.id);
      expect(subtasks).toHaveLength(3);

      const titles = subtasks.map(s => s.title);
      expect(titles).toContain('Subtask 1');
      expect(titles).toContain('Subtask 2');
      expect(titles).toContain('Subtask 3');
    });
  });

  describe('Search', () => {
    let board;

    beforeEach(async () => {
      board = await kit.createBoard({ name: 'Test Board' });

      await kit.createTicket({
        board_id: board.id,
        title: 'Bug in login',
        priority: 'high',
        labels: ['bug']
      });

      await kit.createTicket({
        board_id: board.id,
        title: 'Add new feature',
        priority: 'medium',
        labels: ['feature']
      });

      await kit.createTicket({
        board_id: board.id,
        title: 'Fix authentication bug',
        priority: 'urgent',
        labels: ['bug', 'security']
      });
    });

    test('should search by label', async () => {
      const results = await kit.search(board.id, 'label:bug');
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    test('should search by priority', async () => {
      const results = await kit.search(board.id, 'priority:urgent');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    test('should search by keyword', async () => {
      const results = await kit.search(board.id, 'authentication');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Kanban View', () => {
    let board;

    beforeEach(async () => {
      board = await kit.createBoard({ name: 'Test Board', workflow_id: 'kanban' });

      const ticket1 = await kit.createTicket({ board_id: board.id, title: 'Ticket 1' });
      const ticket2 = await kit.createTicket({ board_id: board.id, title: 'Ticket 2' });
      await kit.moveTicket(ticket2.id, 'todo');

      const ticket3 = await kit.createTicket({ board_id: board.id, title: 'Ticket 3' });
      await kit.moveTicket(ticket3.id, 'todo');
      await kit.moveTicket(ticket3.id, 'in_progress');
    });

    test('should get kanban view with tickets grouped by status', async () => {
      const view = await kit.getKanbanView(board.id);

      expect(view).toBeDefined();
      expect(view.board).toBeDefined();
      expect(view.workflow).toBeDefined();
      expect(view.columns).toBeDefined();

      expect(view.columns.backlog).toBeDefined();
      expect(view.columns.todo).toBeDefined();
      expect(view.columns.in_progress).toBeDefined();
      expect(view.columns.review).toBeDefined();
      expect(view.columns.done).toBeDefined();
    });
  });

  describe('Activity Tracking', () => {
    let board, ticket;

    beforeEach(async () => {
      board = await kit.createBoard({ name: 'Test Board' });
      ticket = await kit.createTicket({
        board_id: board.id,
        title: 'Test Ticket'
      }, 'alice');
    });

    test('should track ticket creation', async () => {
      const activity = await kit.getActivity(ticket.id);

      expect(activity).toBeDefined();
      expect(activity.length).toBeGreaterThan(0);

      const createActivity = activity.find(a => a.action === 'created');
      expect(createActivity).toBeDefined();
      expect(createActivity.actor).toBe('alice');
    });

    test('should track ticket updates', async () => {
      await kit.updateTicket(ticket.id, { title: 'Updated Title' }, 'bob');

      const activity = await kit.getActivity(ticket.id);
      const updateActivity = activity.find(a => a.action === 'updated');

      expect(updateActivity).toBeDefined();
      expect(updateActivity.actor).toBe('bob');
    });

    test('should track status changes', async () => {
      await kit.moveTicket(ticket.id, 'todo', 'charlie');

      const activity = await kit.getActivity(ticket.id);
      const statusActivity = activity.find(a => a.action === 'status_changed');

      expect(statusActivity).toBeDefined();
      expect(statusActivity.actor).toBe('charlie');
    });
  });

  describe('Bulk Operations', () => {
    let board;

    beforeEach(async () => {
      board = await kit.createBoard({ name: 'Test Board' });
    });

    test('should bulk update tickets', async () => {
      const ticket1 = await kit.createTicket({ board_id: board.id, title: 'Ticket 1' });
      const ticket2 = await kit.createTicket({ board_id: board.id, title: 'Ticket 2' });
      const ticket3 = await kit.createTicket({ board_id: board.id, title: 'Ticket 3' });

      await kit.bulkUpdateTickets(
        [ticket1.id, ticket2.id, ticket3.id],
        { priority: 'high', labels: ['urgent'] }
      );

      const updated1 = await kit.getTicket(ticket1.id);
      const updated2 = await kit.getTicket(ticket2.id);
      const updated3 = await kit.getTicket(ticket3.id);

      expect(updated1.priority).toBe('high');
      expect(updated2.priority).toBe('high');
      expect(updated3.priority).toBe('high');
      expect(updated1.labels).toContain('urgent');
    });
  });

  describe('Export/Import', () => {
    test('should export data', async () => {
      const board = await kit.createBoard({ name: 'Test Board' });
      await kit.createTicket({ board_id: board.id, title: 'Ticket 1' });
      await kit.createTicket({ board_id: board.id, title: 'Ticket 2' });

      const exported = await kit.export();

      expect(exported).toBeDefined();
      expect(exported.version).toBeDefined();
      expect(exported.boards).toBeDefined();
      expect(exported.tickets).toBeDefined();
      expect(exported.boards.length).toBeGreaterThan(0);
      expect(exported.tickets.length).toBeGreaterThan(0);
    });

    test('should export and import SQLite database', async () => {
      const { TicketKit, SQLiteAdapter } = require('../index.js');

      // Create test data in current kit
      const board = await kit.createBoard({ name: 'Export Test Board' });
      const ticket = await kit.createTicket({
        board_id: board.id,
        title: 'Export Test Ticket'
      });

      // Export the database
      const dbData = kit.storage.export();
      expect(dbData).toBeDefined();
      expect(dbData instanceof Uint8Array).toBe(true);

      // Create new adapter and import (don't call init, it would reset the DB)
      const newAdapter = new SQLiteAdapter(':memory:');
      await newAdapter.import(dbData);

      // Use constructor directly to avoid calling init() again
      const newKit = new TicketKit(newAdapter);

      // Verify imported data
      const importedBoard = await newKit.getBoard(board.id);
      expect(importedBoard).toBeDefined();
      expect(importedBoard.name).toBe('Export Test Board');

      const importedTicket = await newKit.getTicket(ticket.id);
      expect(importedTicket).toBeDefined();
      expect(importedTicket.title).toBe('Export Test Ticket');

      await newKit.storage.close();
    });

    test('should import into a fresh database', async () => {
      const { TicketKit } = require('../index.js');

      // Create first kit with data
      const sourceKit = await TicketKit.create();
      const board1 = await sourceKit.createBoard({ name: 'Import Board 1' });
      const board2 = await sourceKit.createBoard({ name: 'Import Board 2' });

      await sourceKit.createTicket({ board_id: board1.id, title: 'Import Ticket 1' });
      await sourceKit.createTicket({ board_id: board2.id, title: 'Import Ticket 2' });

      const exported = await sourceKit.export();
      await sourceKit.storage.close();

      // Import into a new fresh kit
      const destKit = await TicketKit.create();
      await destKit.import(exported);

      const boards = await destKit.listBoards();
      expect(boards.length).toBeGreaterThanOrEqual(2);

      const tickets = await destKit.listTickets({});
      expect(tickets.length).toBeGreaterThanOrEqual(2);

      await destKit.storage.close();
    });
  });

  describe('Attachments (v0.2.0)', () => {
    let board, ticket;

    beforeEach(async () => {
      board = await kit.createBoard({ name: 'Test Board' });
      ticket = await kit.createTicket({ board_id: board.id, title: 'Test Ticket' });
    });

    test('should create an attachment', async () => {
      const attachment = await kit.createAttachment({
        ticket_id: ticket.id,
        filename: 'test.pdf',
        original_filename: 'Test Document.pdf',
        mime_type: 'application/pdf',
        size_bytes: 1024,
        storage_path: '/uploads/test.pdf',
        uploaded_by: 'test@example.com'
      });

      expect(attachment).toBeDefined();
      expect(attachment.id).toBeDefined();
      expect(attachment.filename).toBe('test.pdf');
      expect(attachment.original_filename).toBe('Test Document.pdf');
      expect(attachment.mime_type).toBe('application/pdf');
      expect(attachment.size_bytes).toBe(1024);
    });

    test('should list attachments for a ticket', async () => {
      await kit.createAttachment({
        ticket_id: ticket.id,
        filename: 'file1.png',
        original_filename: 'File 1.png',
        mime_type: 'image/png',
        size_bytes: 2048,
        storage_path: '/uploads/file1.png',
        uploaded_by: 'user@example.com'
      });

      await kit.createAttachment({
        ticket_id: ticket.id,
        filename: 'file2.jpg',
        original_filename: 'File 2.jpg',
        mime_type: 'image/jpeg',
        size_bytes: 4096,
        storage_path: '/uploads/file2.jpg',
        uploaded_by: 'user@example.com'
      });

      const attachments = await kit.listAttachments(ticket.id);
      expect(attachments).toHaveLength(2);
    });

    test('should get attachment by id', async () => {
      const attachment = await kit.createAttachment({
        ticket_id: ticket.id,
        filename: 'doc.pdf',
        original_filename: 'Document.pdf',
        mime_type: 'application/pdf',
        size_bytes: 5120,
        storage_path: '/uploads/doc.pdf',
        uploaded_by: 'admin@example.com'
      });

      const retrieved = await kit.getAttachment(attachment.id);
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(attachment.id);
      expect(retrieved.filename).toBe('doc.pdf');
    });

    test('should delete attachment', async () => {
      const attachment = await kit.createAttachment({
        ticket_id: ticket.id,
        filename: 'temp.txt',
        original_filename: 'Temp.txt',
        mime_type: 'text/plain',
        size_bytes: 256,
        storage_path: '/uploads/temp.txt',
        uploaded_by: 'user@example.com'
      });

      await kit.deleteAttachment(attachment.id);
      const retrieved = await kit.getAttachment(attachment.id);
      expect(retrieved).toBeNull();
    });

    test('should use addAttachment convenience method', async () => {
      const attachment = await kit.addAttachment(ticket.id, {
        filename: 'screenshot.png',
        original_filename: 'Screenshot.png',
        mime_type: 'image/png',
        size_bytes: 102400,
        storage_path: '/uploads/screenshot.png'
      }, 'uploader@example.com');

      expect(attachment).toBeDefined();
      expect(attachment.uploaded_by).toBe('uploader@example.com');
    });
  });

  describe('Activity Log Export (v0.2.0)', () => {
    let board, ticket;

    beforeEach(async () => {
      board = await kit.createBoard({ name: 'Export Test Board' });
      ticket = await kit.createTicket({
        board_id: board.id,
        title: 'Test Ticket',
        status: 'backlog'
      }, 'alice');
    });

    test('should export activity log as JSON', async () => {
      // Create some activity
      await kit.moveTicket(ticket.id, 'todo', 'bob');
      await kit.assignTicket(ticket.id, ['charlie'], 'bob');

      const result = await kit.exportActivityLog(board.id, { format: 'json' });

      expect(result).toBeDefined();
      expect(result.format).toBe('json');
      expect(result.count).toBeGreaterThan(0);
      expect(result.data).toBeDefined();

      const logs = JSON.parse(result.data);
      expect(Array.isArray(logs)).toBe(true);
    });

    test('should export activity log as CSV', async () => {
      await kit.moveTicket(ticket.id, 'todo', 'alice');

      const result = await kit.exportActivityLog(board.id, { format: 'csv' });

      expect(result).toBeDefined();
      expect(result.format).toBe('csv');
      expect(result.data).toContain('timestamp');
      expect(result.data).toContain('ticket_id');
      expect(result.data).toContain('actor');
      expect(result.data).toContain('action');
    });

    test('should filter activity by date range', async () => {
      const from = new Date().toISOString();
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await kit.moveTicket(ticket.id, 'todo', 'alice');

      const result = await kit.exportActivityLog(board.id, {
        format: 'json',
        from: from
      });

      expect(result.count).toBeGreaterThan(0);
    });

    test('should query activity with filters', async () => {
      await kit.moveTicket(ticket.id, 'todo', 'alice');
      await kit.addComment(ticket.id, 'Test comment', 'bob');

      const activities = await kit.storage.queryActivity(board.id, {
        actions: ['status_changed']
      });

      expect(Array.isArray(activities)).toBe(true);
      expect(activities.length).toBeGreaterThan(0);
      expect(activities[0].action).toBe('status_changed');
    });
  });

  describe('Cumulative Flow Diagram (v0.2.0)', () => {
    let board;

    beforeEach(async () => {
      board = await kit.createBoard({ name: 'CFD Test Board', workflow_id: 'kanban' });
      // Create some tickets in different statuses
      await kit.createTicket({ board_id: board.id, title: 'Ticket 1', status: 'backlog' });
      await kit.createTicket({ board_id: board.id, title: 'Ticket 2', status: 'todo' });
      await kit.createTicket({ board_id: board.id, title: 'Ticket 3', status: 'in_progress' });
      await kit.createTicket({ board_id: board.id, title: 'Ticket 4', status: 'done' });
    });

    test('should take snapshot of current state', async () => {
      const snapshots = await kit.takeSnapshot(board.id);

      expect(Array.isArray(snapshots)).toBe(true);
      expect(snapshots.length).toBe(5); // kanban has 5 states

      const backlogSnapshot = snapshots.find(s => s.status === 'backlog');
      expect(backlogSnapshot).toBeDefined();
      expect(backlogSnapshot.count).toBe(1);

      const doneSnapshot = snapshots.find(s => s.status === 'done');
      expect(doneSnapshot.count).toBe(1);
    });

    test('should get CFD data', async () => {
      await kit.takeSnapshot(board.id);

      const cfdData = await kit.getCFDData(board.id);

      expect(Array.isArray(cfdData)).toBe(true);
      expect(cfdData.length).toBeGreaterThan(0);

      const snapshot = cfdData[0];
      expect(snapshot.date).toBeDefined();
      expect(snapshot.backlog).toBeDefined();
      expect(snapshot.todo).toBeDefined();
      expect(snapshot.in_progress).toBeDefined();
      expect(snapshot.done).toBeDefined();
    });

    test('should filter CFD data by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      await kit.takeSnapshot(board.id, today);

      const cfdData = await kit.getCFDData(board.id, {
        from: today,
        to: today
      });

      expect(Array.isArray(cfdData)).toBe(true);
      expect(cfdData.length).toBeGreaterThan(0);
    });

    test('should backfill snapshots from activity history', async () => {
      // Create some activity first
      const ticket = await kit.createTicket({
        board_id: board.id,
        title: 'Backfill Test',
        status: 'backlog'
      });
      await kit.moveTicket(ticket.id, 'todo');
      await kit.moveTicket(ticket.id, 'in_progress');

      const snapshots = await kit.backfillSnapshots(board.id);

      expect(Array.isArray(snapshots)).toBe(true);
    });
  });

  describe('Custom Workflows (v0.2.0)', () => {
    test('should create custom workflow', async () => {
      const workflow = await kit.createWorkflow({
        id: 'content-pipeline',
        name: 'Content Pipeline',
        states: ['draft', 'review', 'approved', 'published'],
        transitions: {
          draft: ['review'],
          review: ['draft', 'approved'],
          approved: ['published'],
          published: []
        }
      });

      expect(workflow).toBeDefined();
      expect(workflow.id).toBe('content-pipeline');
      expect(workflow.states).toHaveLength(4);
    });

    test('should get custom workflow', async () => {
      await kit.createWorkflow({
        id: 'custom-wf',
        name: 'Custom Workflow',
        states: ['start', 'middle', 'end'],
        transitions: {
          start: ['middle'],
          middle: ['end'],
          end: []
        }
      });

      const workflow = await kit.getWorkflow('custom-wf');
      expect(workflow).toBeDefined();
      expect(workflow.name).toBe('Custom Workflow');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    let board, ticket;

    beforeEach(async () => {
      board = await kit.createBoard({ name: 'Edge Case Board' });
      ticket = await kit.createTicket({
        board_id: board.id,
        title: 'Edge Case Ticket'
      });
    });

    test('should return null for non-existent board', async () => {
      const nonExistent = await kit.getBoard('non-existent-id');
      expect(nonExistent).toBeNull();
    });

    test('should return null for non-existent ticket', async () => {
      const nonExistent = await kit.getTicket('non-existent-id');
      expect(nonExistent).toBeNull();
    });

    test('should handle reassigning users', async () => {
      await kit.assignTicket(ticket.id, ['alice', 'bob']);
      // Reassign to just bob
      await kit.assignTicket(ticket.id, ['bob']);

      const updated = await kit.getTicket(ticket.id);
      expect(updated.assignees).toEqual(['bob']);
    });

    test('should list comments', async () => {
      const comment = await kit.addComment(ticket.id, 'Test comment', 'alice');
      const comments = await kit.listComments(ticket.id);
      expect(comments.some(c => c.id === comment.id)).toBe(true);
    });

    test('should handle getting activity for ticket', async () => {
      await kit.moveTicket(ticket.id, 'todo');
      const activity = await kit.getActivity(ticket.id);
      expect(activity).toBeDefined();
      expect(activity.length).toBeGreaterThan(0);
    });

    test('should handle ticket with due date', async () => {
      const dueDate = '2025-12-31';
      const ticketWithDue = await kit.createTicket({
        board_id: board.id,
        title: 'Due date ticket',
        due_date: dueDate
      });

      expect(ticketWithDue.due_date).toBe(dueDate);
    });

    test('should handle ticket with custom fields', async () => {
      const customTicket = await kit.createTicket({
        board_id: board.id,
        title: 'Custom fields ticket',
        custom_fields: { sprint: 'Sprint 1', estimated_hours: 8 }
      });

      expect(customTicket.custom_fields).toEqual({ sprint: 'Sprint 1', estimated_hours: 8 });
    });

    test('should get workflow by id', async () => {
      const workflow = await kit.getWorkflow('kanban');
      expect(workflow).toBeDefined();
      expect(workflow.id).toBe('kanban');
      expect(workflow.states).toBeDefined();
    });

    test('should handle backlog view', async () => {
      await kit.createTicket({ board_id: board.id, title: 'Backlog 1', status: 'backlog' });
      await kit.createTicket({ board_id: board.id, title: 'Backlog 2', status: 'backlog' });

      const backlog = await kit.getBacklog(board.id);
      expect(backlog.length).toBeGreaterThan(0);
    });

    test('should handle event listeners', async () => {
      let eventFired = false;
      const handler = (data) => {
        expect(data.title).toBe('Event test ticket');
        eventFired = true;
      };

      kit.on('ticket:created', handler);
      await kit.createTicket({ board_id: board.id, title: 'Event test ticket' });
      expect(eventFired).toBe(true);
    });

    test('should handle ticket with all priority levels', async () => {
      const urgent = await kit.createTicket({ board_id: board.id, title: 'Urgent', priority: 'urgent' });
      const high = await kit.createTicket({ board_id: board.id, title: 'High', priority: 'high' });
      const medium = await kit.createTicket({ board_id: board.id, title: 'Medium', priority: 'medium' });
      const low = await kit.createTicket({ board_id: board.id, title: 'Low', priority: 'low' });

      expect(urgent.priority).toBe('urgent');
      expect(high.priority).toBe('high');
      expect(medium.priority).toBe('medium');
      expect(low.priority).toBe('low');
    });

    test('should handle listing tickets with assignee filter', async () => {
      await kit.createTicket({ board_id: board.id, title: 'Alice task', assignees: ['alice'] });
      await kit.createTicket({ board_id: board.id, title: 'Bob task', assignees: ['bob'] });

      const aliceTasks = await kit.listTickets({ board_id: board.id, assignee: 'alice' });
      expect(aliceTasks.some(t => t.title === 'Alice task')).toBe(true);
    });

    test('should handle listing tickets with label filter', async () => {
      await kit.createTicket({ board_id: board.id, title: 'Bug ticket', labels: ['bug'] });
      await kit.createTicket({ board_id: board.id, title: 'Feature ticket', labels: ['feature'] });

      const bugs = await kit.listTickets({ board_id: board.id, label: 'bug' });
      expect(bugs.some(t => t.title === 'Bug ticket')).toBe(true);
    });

    test('should create ticket with position', async () => {
      const positioned = await kit.createTicket({
        board_id: board.id,
        title: 'Positioned ticket',
        position: 5
      });

      expect(positioned.position).toBe(5);
    });
  });
});

// ============================================================================
// PostgreSQL Adapter Tests (v0.2.0)
// ============================================================================

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const describeIfPostgres = TEST_DATABASE_URL ? describe : describe.skip;

describeIfPostgres('PostgreSQL Adapter (v0.2.0)', () => {
  let kit;
  let adapter;
  let board;
  let ticket;

  beforeAll(async () => {
    if (!TEST_DATABASE_URL) {
      console.log('⚠️  Skipping PostgreSQL tests - set TEST_DATABASE_URL to enable');
      return;
    }

    adapter = new PostgreSQLAdapter(TEST_DATABASE_URL);
    await adapter.init();
    kit = await TicketKit.create({ storage: adapter });
  });

  afterAll(async () => {
    if (adapter) {
      // Clean up test data
      try {
        const boards = await kit.listBoards();
        for (const b of boards) {
          await kit.deleteBoard(b.id);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      await adapter.close();
    }
  });

  beforeEach(async () => {
    if (!TEST_DATABASE_URL) return;
    board = await kit.createBoard({ name: 'PostgreSQL Test Board' });
    ticket = await kit.createTicket({
      board_id: board.id,
      title: 'PostgreSQL Test Ticket',
      status: 'backlog',
      priority: 'high'
    });
  });

  describe('Board Operations', () => {
    test('should create board with PostgreSQL', async () => {
      expect(board).toBeDefined();
      expect(board.id).toBeDefined();
      expect(board.name).toBe('PostgreSQL Test Board');
    });

    test('should get board by ID', async () => {
      const retrieved = await kit.getBoard(board.id);
      expect(retrieved).toBeDefined();
      expect(retrieved.name).toBe('PostgreSQL Test Board');
    });

    test('should list all boards', async () => {
      const boards = await kit.listBoards();
      expect(boards.length).toBeGreaterThan(0);
      expect(boards.some(b => b.id === board.id)).toBe(true);
    });

    test('should update board', async () => {
      await kit.updateBoard(board.id, { name: 'Updated PostgreSQL Board' });
      const updated = await kit.getBoard(board.id);
      expect(updated.name).toBe('Updated PostgreSQL Board');
    });

    test('should delete board', async () => {
      const tempBoard = await kit.createBoard({ name: 'Temp Board' });
      await kit.deleteBoard(tempBoard.id);
      const deleted = await kit.getBoard(tempBoard.id);
      expect(deleted).toBeNull();
    });
  });

  describe('Ticket Operations', () => {
    test('should create ticket', async () => {
      expect(ticket).toBeDefined();
      expect(ticket.title).toBe('PostgreSQL Test Ticket');
      expect(ticket.priority).toBe('high');
    });

    test('should get ticket by ID', async () => {
      const retrieved = await kit.getTicket(ticket.id);
      expect(retrieved).toBeDefined();
      expect(retrieved.title).toBe('PostgreSQL Test Ticket');
    });

    test('should list tickets for board', async () => {
      const tickets = await kit.listTickets({ board_id: board.id });
      expect(tickets.length).toBeGreaterThan(0);
      expect(tickets.some(t => t.id === ticket.id)).toBe(true);
    });

    test('should update ticket', async () => {
      await kit.updateTicket(ticket.id, { title: 'Updated Ticket' });
      const updated = await kit.getTicket(ticket.id);
      expect(updated.title).toBe('Updated Ticket');
    });

    test('should delete ticket', async () => {
      const tempTicket = await kit.createTicket({
        board_id: board.id,
        title: 'Temp Ticket'
      });
      await kit.deleteTicket(tempTicket.id);
      const deleted = await kit.getTicket(tempTicket.id);
      expect(deleted).toBeNull();
    });

    test('should handle bulk update', async () => {
      const ticket2 = await kit.createTicket({
        board_id: board.id,
        title: 'Ticket 2',
        priority: 'low'
      });

      await kit.bulkUpdateTickets([ticket.id, ticket2.id], { priority: 'urgent' });

      const updated1 = await kit.getTicket(ticket.id);
      const updated2 = await kit.getTicket(ticket2.id);
      expect(updated1.priority).toBe('urgent');
      expect(updated2.priority).toBe('urgent');
    });
  });

  describe('Comments', () => {
    test('should add comment to ticket', async () => {
      const comment = await kit.addComment(ticket.id, 'Test comment', 'alice');
      expect(comment).toBeDefined();
      expect(comment.content).toBe('Test comment');
      expect(comment.author).toBe('alice');
    });

    test('should list comments', async () => {
      await kit.addComment(ticket.id, 'Comment 1', 'alice');
      await kit.addComment(ticket.id, 'Comment 2', 'bob');

      const comments = await kit.listComments(ticket.id);
      expect(comments.length).toBe(2);
    });

    test('should reply to comment', async () => {
      const parent = await kit.addComment(ticket.id, 'Parent comment', 'alice');
      const reply = await kit.replyToComment(ticket.id, parent.id, 'Reply', 'bob');

      expect(reply.parent_id).toBe(parent.id);
      expect(reply.content).toBe('Reply');
    });
  });

  describe('Attachments (PostgreSQL)', () => {
    test('should create attachment', async () => {
      const attachment = await kit.createAttachment({
        ticket_id: ticket.id,
        filename: 'test.pdf',
        original_filename: 'Test Document.pdf',
        mime_type: 'application/pdf',
        size_bytes: 1024,
        storage_path: '/uploads/test.pdf',
        uploaded_by: 'alice'
      });

      expect(attachment).toBeDefined();
      expect(attachment.filename).toBe('test.pdf');
    });

    test('should list attachments', async () => {
      await kit.createAttachment({
        ticket_id: ticket.id,
        filename: 'file1.jpg',
        original_filename: 'file1.jpg',
        mime_type: 'image/jpeg',
        size_bytes: 2048,
        storage_path: '/uploads/file1.jpg',
        uploaded_by: 'bob'
      });

      const attachments = await kit.listAttachments(ticket.id);
      expect(attachments.length).toBeGreaterThan(0);
    });

    test('should delete attachment', async () => {
      const attachment = await kit.createAttachment({
        ticket_id: ticket.id,
        filename: 'temp.txt',
        original_filename: 'temp.txt',
        mime_type: 'text/plain',
        size_bytes: 100,
        storage_path: '/uploads/temp.txt',
        uploaded_by: 'alice'
      });

      await kit.deleteAttachment(attachment.id);
      const retrieved = await kit.getAttachment(attachment.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Activity Tracking (PostgreSQL)', () => {
    test('should track ticket creation', async () => {
      const activity = await kit.getActivity(ticket.id);
      expect(activity.length).toBeGreaterThan(0);
      expect(activity[0].action).toBe('created');
    });

    test('should track status changes', async () => {
      await kit.moveTicket(ticket.id, 'todo');
      const activity = await kit.getActivity(ticket.id);
      expect(activity.some(a => a.action === 'status_changed')).toBe(true);
    });

    test('should export activity log as JSON', async () => {
      await kit.moveTicket(ticket.id, 'todo');
      const exported = await kit.exportActivityLog(board.id, { format: 'json' });
      expect(exported.format).toBe('json');
      expect(JSON.parse(exported.data)).toBeDefined();
    });

    test('should export activity log as CSV', async () => {
      const exported = await kit.exportActivityLog(board.id, { format: 'csv' });
      expect(exported.format).toBe('csv');
      expect(exported.data).toContain('Ticket ID');
    });
  });

  describe('CFD / Snapshots (PostgreSQL)', () => {
    test('should take snapshot', async () => {
      const snapshots = await kit.takeSnapshot(board.id);
      expect(snapshots).toBeDefined();
      expect(snapshots.length).toBeGreaterThan(0);
    });

    test('should get CFD data', async () => {
      await kit.takeSnapshot(board.id);
      const cfdData = await kit.getCFDData(board.id);
      expect(cfdData).toBeDefined();
      expect(Array.isArray(cfdData)).toBe(true);
    });

    test('should backfill snapshots', async () => {
      await kit.moveTicket(ticket.id, 'todo');
      await kit.moveTicket(ticket.id, 'in_progress');

      const backfilled = await kit.backfillSnapshots(board.id, {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      });

      expect(backfilled).toBeDefined();
      expect(Array.isArray(backfilled)).toBe(true);
    });
  });

  describe('Workflows (PostgreSQL)', () => {
    test('should get default workflow', async () => {
      const workflow = await kit.getWorkflow('kanban');
      expect(workflow).toBeDefined();
      expect(workflow.states).toBeDefined();
    });

    test('should create custom workflow', async () => {
      await kit.createWorkflow({
        id: 'pg-custom',
        name: 'PG Custom Workflow',
        states: ['start', 'middle', 'end'],
        transitions: {
          start: ['middle'],
          middle: ['end'],
          end: []
        }
      });

      const workflow = await kit.getWorkflow('pg-custom');
      expect(workflow).toBeDefined();
      expect(workflow.name).toBe('PG Custom Workflow');
    });
  });

  describe('Search (PostgreSQL)', () => {
    test('should search by status', async () => {
      const results = await kit.search(board.id, 'status:backlog');
      expect(results.some(t => t.id === ticket.id)).toBe(true);
    });

    test('should search by priority', async () => {
      const results = await kit.search(board.id, 'priority:high');
      expect(results.some(t => t.id === ticket.id)).toBe(true);
    });

    test('should search by keyword', async () => {
      const results = await kit.search(board.id, 'PostgreSQL');
      expect(results.some(t => t.id === ticket.id)).toBe(true);
    });
  });
});
