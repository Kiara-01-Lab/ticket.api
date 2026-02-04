/**
 * TicketKit Unit Tests
 * Comprehensive test suite for TicketKit SDK
 */

const { TicketKit, WORKFLOWS } = require('../index.js');

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
  });
});
