#!/usr/bin/env node

/**
 * ticket.api - CLI Task Manager
 * 
 * A command-line task manager built with ticket.api.
 * 
 * Usage:
 *   ticket add "My new task" --priority high --labels bug,urgent
 *   ticket list
 *   ticket board
 *   ticket move <id> in_progress
 *   ticket done <id>
 *   ticket delete <id>
 */

const { TicketKit } = require('ticketkit');
const path = require('path');
const os = require('os');

// ── Config ──────────────────────────────────────────────────────────────────

const DB_PATH = process.env.TICKET_DB || path.join(os.homedir(), '.ticketkit.db');
const DEFAULT_BOARD = 'default';

// ── Colors ──────────────────────────────────────────────────────────────────

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function c(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

// ── Priority ────────────────────────────────────────────────────────────────

const priorityColors = {
  urgent: 'red',
  high: 'yellow',
  medium: 'cyan',
  low: 'green',
};

const prioritySymbols = {
  urgent: '!!!',
  high: '!! ',
  medium: '!  ',
  low: '   ',
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function shortId(id) {
  return id.slice(0, 6);
}

function printTicket(ticket, verbose = false) {
  const priority = c(priorityColors[ticket.priority] || 'white', prioritySymbols[ticket.priority] || '   ');
  const id = c('dim', `#${shortId(ticket.id)}`);
  const title = ticket.title;
  const labels = ticket.labels.length > 0 ? c('blue', ` [${ticket.labels.join(', ')}]`) : '';
  
  console.log(`  ${priority} ${id} ${title}${labels}`);
  
  if (verbose && ticket.description) {
    console.log(c('dim', `      ${ticket.description}`));
  }
}

// ── Commands ────────────────────────────────────────────────────────────────

async function cmdAdd(kit, args) {
  const title = args._.slice(1).join(' ');
  
  if (!title) {
    console.log(c('red', 'Error: Please provide a title'));
    console.log('Usage: ticket add "My task title"');
    return;
  }
  
  // Get or create default board
  let board = (await kit.listBoards()).find(b => b.name === DEFAULT_BOARD);
  if (!board) {
    board = await kit.createBoard({ name: DEFAULT_BOARD, workflow_id: 'simple' });
  }
  
  const ticket = await kit.createTicket({
    board_id: board.id,
    title,
    priority: args.priority || args.p || 'medium',
    labels: args.labels ? args.labels.split(',').map(l => l.trim()) : [],
  });
  
  console.log(c('green', '✓') + ` Created ticket ${c('dim', '#' + shortId(ticket.id))}`);
  printTicket(ticket);
}

async function cmdList(kit, args) {
  const boards = await kit.listBoards();
  
  if (boards.length === 0) {
    console.log(c('dim', 'No tickets yet. Add one with: ticket add "My task"'));
    return;
  }
  
  for (const board of boards) {
    const tickets = await kit.listTickets({ board_id: board.id });
    
    if (tickets.length === 0) continue;
    
    // Group by status
    const byStatus = {};
    for (const ticket of tickets) {
      if (!byStatus[ticket.status]) byStatus[ticket.status] = [];
      byStatus[ticket.status].push(ticket);
    }
    
    console.log(c('bold', `\n${board.name}`));
    console.log(c('dim', '─'.repeat(40)));
    
    for (const [status, items] of Object.entries(byStatus)) {
      console.log(c('cyan', `\n${status.toUpperCase()} (${items.length})`));
      for (const ticket of items) {
        printTicket(ticket, args.verbose || args.v);
      }
    }
  }
  
  console.log('');
}

async function cmdBoard(kit, args) {
  const boards = await kit.listBoards();
  
  if (boards.length === 0) {
    console.log(c('dim', 'No boards yet. Add a ticket with: ticket add "My task"'));
    return;
  }
  
  const board = boards[0];
  const { columns } = await kit.getKanbanView(board.id);
  
  const statusLabels = {
    todo: '📋 TO DO',
    doing: '🔨 DOING',
    done: '✅ DONE',
    backlog: '📥 BACKLOG',
    in_progress: '🔨 IN PROGRESS',
    review: '👀 REVIEW',
  };
  
  console.log(c('bold', `\n🎫 ${board.name}`));
  console.log(c('dim', '═'.repeat(60)));
  
  for (const [status, items] of Object.entries(columns)) {
    const label = statusLabels[status] || status.toUpperCase();
    console.log(c('cyan', `\n${label} (${items.length})`));
    console.log(c('dim', '─'.repeat(40)));
    
    if (items.length === 0) {
      console.log(c('dim', '  (empty)'));
    } else {
      for (const ticket of items) {
        printTicket(ticket);
      }
    }
  }
  
  console.log('');
}

async function cmdMove(kit, args) {
  const [, ticketId, newStatus] = args._;
  
  if (!ticketId || !newStatus) {
    console.log(c('red', 'Error: Please provide ticket ID and new status'));
    console.log('Usage: ticket move <id> <status>');
    console.log('Example: ticket move abc123 doing');
    return;
  }
  
  // Find ticket by short ID
  const boards = await kit.listBoards();
  let found = null;
  
  for (const board of boards) {
    const tickets = await kit.listTickets({ board_id: board.id });
    found = tickets.find(t => t.id.startsWith(ticketId));
    if (found) break;
  }
  
  if (!found) {
    console.log(c('red', `Error: Ticket #${ticketId} not found`));
    return;
  }
  
  try {
    await kit.moveTicket(found.id, newStatus);
    console.log(c('green', '✓') + ` Moved ${c('dim', '#' + shortId(found.id))} to ${c('cyan', newStatus)}`);
  } catch (err) {
    console.log(c('red', `Error: ${err.message}`));
  }
}

async function cmdDone(kit, args) {
  const ticketId = args._[1];
  
  if (!ticketId) {
    console.log(c('red', 'Error: Please provide ticket ID'));
    console.log('Usage: ticket done <id>');
    return;
  }
  
  // Find ticket
  const boards = await kit.listBoards();
  let found = null;
  
  for (const board of boards) {
    const tickets = await kit.listTickets({ board_id: board.id });
    found = tickets.find(t => t.id.startsWith(ticketId));
    if (found) break;
  }
  
  if (!found) {
    console.log(c('red', `Error: Ticket #${ticketId} not found`));
    return;
  }
  
  try {
    await kit.moveTicket(found.id, 'done');
    console.log(c('green', '✓') + ` Completed ${c('dim', '#' + shortId(found.id))} "${found.title}"`);
  } catch (err) {
    console.log(c('red', `Error: ${err.message}`));
  }
}

async function cmdDelete(kit, args) {
  const ticketId = args._[1];
  
  if (!ticketId) {
    console.log(c('red', 'Error: Please provide ticket ID'));
    console.log('Usage: ticket delete <id>');
    return;
  }
  
  // Find ticket
  const boards = await kit.listBoards();
  let found = null;
  
  for (const board of boards) {
    const tickets = await kit.listTickets({ board_id: board.id });
    found = tickets.find(t => t.id.startsWith(ticketId));
    if (found) break;
  }
  
  if (!found) {
    console.log(c('red', `Error: Ticket #${ticketId} not found`));
    return;
  }
  
  await kit.deleteTicket(found.id);
  console.log(c('green', '✓') + ` Deleted ${c('dim', '#' + shortId(found.id))} "${found.title}"`);
}

async function cmdHelp() {
  console.log(`
${c('bold', '🎫 ticket - CLI Task Manager')}

${c('cyan', 'Usage:')}
  ticket <command> [options]

${c('cyan', 'Commands:')}
  add <title>           Create a new ticket
  list, ls              List all tickets
  board                 Show Kanban board view
  move <id> <status>    Move ticket to new status
  done <id>             Mark ticket as done
  delete, rm <id>       Delete a ticket
  help                  Show this help

${c('cyan', 'Options for add:')}
  -p, --priority        Set priority (low, medium, high, urgent)
  --labels              Comma-separated labels

${c('cyan', 'Examples:')}
  ticket add "Fix login bug" -p high --labels bug,auth
  ticket add "Write documentation"
  ticket list
  ticket board
  ticket move abc123 doing
  ticket done abc123
  ticket rm abc123

${c('cyan', 'Environment:')}
  TICKET_DB             Database path (default: ~/.ticketkit.db)
`);
}

// ── Argument Parser ─────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { _: [] };
  let i = 0;
  
  while (i < argv.length) {
    const arg = argv[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(arg);
    }
    
    i++;
  }
  
  return args;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || 'help';
  
  // Initialize
  const kit = await TicketKit.create({ dbPath: DB_PATH });
  
  // Run command
  switch (command) {
    case 'add':
    case 'new':
    case 'create':
      await cmdAdd(kit, args);
      break;
      
    case 'list':
    case 'ls':
      await cmdList(kit, args);
      break;
      
    case 'board':
    case 'kanban':
      await cmdBoard(kit, args);
      break;
      
    case 'move':
    case 'mv':
      await cmdMove(kit, args);
      break;
      
    case 'done':
    case 'complete':
    case 'finish':
      await cmdDone(kit, args);
      break;
      
    case 'delete':
    case 'rm':
    case 'remove':
      await cmdDelete(kit, args);
      break;
      
    case 'help':
    case '--help':
    case '-h':
      await cmdHelp();
      break;
      
    default:
      console.log(c('red', `Unknown command: ${command}`));
      console.log('Run `ticket help` for usage information');
  }
}

main().catch(err => {
  console.error(c('red', `Error: ${err.message}`));
  process.exit(1);
});
