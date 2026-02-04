// Type definitions for TicketKit
// Project: https://github.com/Kiara-01-Lab/ticket.api-public
// Definitions by: TicketKit Contributors

export interface TicketKitConfig {
  storage?: 'memory' | 'file';
  filename?: string;
  adapter?: StorageAdapter;
}

export interface Board {
  id: string;
  name: string;
  workflow_id: string;
  created_at: number;
  updated_at: number;
}

export interface Ticket {
  id: string;
  board_id: string;
  title: string;
  description?: string;
  status: string;
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  labels?: string[];
  assignees?: string[];
  created_by?: string;
  created_at: number;
  updated_at: number;
  due_date?: number;
  parent_id?: string;
}

export interface Comment {
  id: string;
  ticket_id: string;
  parent_comment_id?: string;
  user_id: string;
  content: string;
  created_at: number;
}

export interface Activity {
  id: string;
  ticket_id: string;
  user_id: string;
  action: string;
  field?: string;
  old_value?: string;
  new_value?: string;
  created_at: number;
}

export interface Workflow {
  id: string;
  name: string;
  states: string[];
  transitions: Record<string, string[]>;
}

export interface StorageAdapter {
  init(): Promise<void>;
  query(sql: string, params?: any[]): Promise<any[]>;
  exec(sql: string): Promise<void>;
}

export interface KanbanColumn {
  status: string;
  tickets: Ticket[];
}

export interface SearchOptions {
  board_id?: string;
  status?: string;
  priority?: string;
  labels?: string[];
  assignees?: string[];
  keyword?: string;
}

export interface BulkOperationResult {
  updated: number;
  failed: number;
}

export default class TicketKit {
  constructor(config?: TicketKitConfig);

  // Board Management
  createBoard(name: string, workflowId?: string): Promise<Board>;
  getBoard(boardId: string): Promise<Board>;
  listBoards(): Promise<Board[]>;
  updateBoard(boardId: string, updates: Partial<Board>): Promise<Board>;
  deleteBoard(boardId: string): Promise<void>;

  // Ticket Management
  createTicket(boardId: string, data: Partial<Ticket>): Promise<Ticket>;
  getTicket(ticketId: string): Promise<Ticket>;
  updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket>;
  deleteTicket(ticketId: string): Promise<void>;
  listTickets(boardId: string): Promise<Ticket[]>;

  // Status Transitions
  transitionTicket(ticketId: string, newStatus: string): Promise<Ticket>;

  // Assignees
  assignTicket(ticketId: string, userId: string): Promise<Ticket>;
  unassignTicket(ticketId: string, userId: string): Promise<Ticket>;

  // Comments
  addComment(ticketId: string, userId: string, content: string, parentCommentId?: string): Promise<Comment>;
  getComments(ticketId: string): Promise<Comment[]>;

  // Subtasks
  createSubtask(parentTicketId: string, data: Partial<Ticket>): Promise<Ticket>;
  getSubtasks(ticketId: string): Promise<Ticket[]>;

  // Search
  searchTickets(options: SearchOptions): Promise<Ticket[]>;

  // Kanban View
  getKanbanView(boardId: string): Promise<KanbanColumn[]>;

  // Activity Tracking
  getActivity(ticketId: string): Promise<Activity[]>;

  // Bulk Operations
  bulkUpdateTickets(ticketIds: string[], updates: Partial<Ticket>): Promise<BulkOperationResult>;

  // Export/Import
  exportBoard(boardId: string): Promise<string>;
  importBoard(data: string): Promise<Board>;

  // Events
  on(event: string, callback: (data: any) => void): void;
  off(event: string, callback: (data: any) => void): void;

  // Workflows
  getWorkflow(workflowId: string): Workflow | undefined;
  listWorkflows(): Workflow[];

  // Storage
  close(): Promise<void>;
}
