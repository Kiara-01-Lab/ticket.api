# 04 - CLI Tool

> A command-line task manager built with ticket.api.

## What This Demonstrates

- Building a CLI application with ticket.api
- Using the "simple" workflow (todo → doing → done)
- Persistent storage in home directory
- Colorful terminal output
- Short ID references

## Quick Start

```bash
npm install

# Add to PATH for global use
npm link

# Or run directly
node index.js help
```

## Usage

```
🎫 ticket - CLI Task Manager

Usage:
  ticket <command> [options]

Commands:
  add <title>           Create a new ticket
  list, ls              List all tickets
  board                 Show Kanban board view
  move <id> <status>    Move ticket to new status
  done <id>             Mark ticket as done
  delete, rm <id>       Delete a ticket
  help                  Show this help

Options for add:
  -p, --priority        Set priority (low, medium, high, urgent)
  --labels              Comma-separated labels

Examples:
  ticket add "Fix login bug" -p high --labels bug,auth
  ticket add "Write documentation"
  ticket list
  ticket board
  ticket move abc123 doing
  ticket done abc123
  ticket rm abc123
```

## Examples

### Add a Task

```bash
$ ticket add "Build landing page" -p high --labels frontend,design

✓ Created ticket #a1b2c3
  !!  #a1b2c3 Build landing page [frontend, design]
```

### List Tasks

```bash
$ ticket list

default
────────────────────────────────────────

TODO (2)
  !!  #a1b2c3 Build landing page [frontend, design]
  !   #d4e5f6 Write API documentation

DOING (1)
  !!! #g7h8i9 Fix critical bug [urgent]

DONE (1)
     #j0k1l2 Set up CI/CD
```

### Show Board

```bash
$ ticket board

🎫 default
════════════════════════════════════════════════════════════

📋 TO DO (2)
────────────────────────────────────────
  !!  #a1b2c3 Build landing page [frontend, design]
  !   #d4e5f6 Write API documentation

🔨 DOING (1)
────────────────────────────────────────
  !!! #g7h8i9 Fix critical bug [urgent]

✅ DONE (1)
────────────────────────────────────────
     #j0k1l2 Set up CI/CD
```

### Move a Task

```bash
$ ticket move a1b2c3 doing
✓ Moved #a1b2c3 to doing
```

### Complete a Task

```bash
$ ticket done a1b2c3
✓ Completed #a1b2c3 "Build landing page"
```

### Delete a Task

```bash
$ ticket rm d4e5f6
✓ Deleted #d4e5f6 "Write API documentation"
```

## Priority Levels

| Priority | Symbol | Color |
|----------|--------|-------|
| urgent | `!!!` | Red |
| high | `!! ` | Yellow |
| medium | `!  ` | Cyan |
| low | `   ` | Green |

## Configuration

### Database Location

By default, data is stored in `~/.ticketkit.db`. Override with:

```bash
export TICKET_DB=/path/to/custom.db
ticket list
```

## Global Installation

To use `ticket` command globally:

```bash
npm link
```

Now you can use `ticket` from anywhere:

```bash
cd ~/projects/myapp
ticket add "Implement feature X"
```

## Customization Ideas

### Add Due Dates

```javascript
// In cmdAdd:
const ticket = await kit.createTicket({
  // ...
  due_date: args.due || args.d,
});
```

### Add Interactive Mode

Use a library like `inquirer` for interactive prompts:

```javascript
const { select } = require('@inquirer/prompts');

const status = await select({
  message: 'New status',
  choices: ['todo', 'doing', 'done']
});
```

### Add Watch Mode

Auto-refresh the board:

```javascript
async function cmdWatch(kit) {
  while (true) {
    console.clear();
    await cmdBoard(kit);
    await sleep(5000);
  }
}
```

## Next Steps

- **[05-slack-bot](../05-slack-bot)** — Slack integration
- **[06-discord-bot](../06-discord-bot)** — Discord integration
- **[verticals/](../verticals)** — Industry-specific examples
