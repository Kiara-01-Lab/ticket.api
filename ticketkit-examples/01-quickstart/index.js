#!/usr/bin/env node

/**
 * ticket.api - Quickstart Example
 * 
 * The simplest possible demo. Run this to see ticket.api in action.
 * 
 * Usage:
 *   node index.js
 */

const { TicketKit } = require('ticketkit');

async function main() {
  console.log('🎫 ticket.api - Quickstart Demo\n');

  // Initialize (in-memory by default)
  const kit = await TicketKit.create();
  console.log('✅ Initialized ticket.api\n');

  // Create a board
  const board = await kit.createBoard({ 
    name: 'My First Board',
    workflow_id: 'kanban'
  });
  console.log(`📋 Created board: "${board.name}" (${board.id})\n`);

  // Add some tickets
  const tickets = [
    { title: 'Learn ticket.api basics', priority: 'high', labels: ['learning'] },
    { title: 'Build a custom workflow', priority: 'medium', labels: ['feature'] },
    { title: 'Deploy to production', priority: 'low', labels: ['devops'] },
    { title: 'Write documentation', priority: 'medium', labels: ['docs'] },
  ];

  console.log('🎫 Creating tickets...');
  for (const data of tickets) {
    const ticket = await kit.createTicket({ board_id: board.id, ...data });
    console.log(`   • ${ticket.title} [${ticket.priority}]`);
  }
  console.log('');

  // Move some tickets through the workflow
  const allTickets = await kit.listTickets({ board_id: board.id });
  
  // Move first ticket to in_progress
  await kit.moveTicket(allTickets[0].id, 'todo');
  await kit.moveTicket(allTickets[0].id, 'in_progress');
  console.log(`➡️  Moved "${allTickets[0].title}" to in_progress`);

  // Move second ticket to todo
  await kit.moveTicket(allTickets[1].id, 'todo');
  console.log(`➡️  Moved "${allTickets[1].title}" to todo`);

  // Move third ticket to done
  await kit.moveTicket(allTickets[2].id, 'todo');
  await kit.moveTicket(allTickets[2].id, 'in_progress');
  await kit.moveTicket(allTickets[2].id, 'review');
  await kit.moveTicket(allTickets[2].id, 'done');
  console.log(`➡️  Moved "${allTickets[2].title}" to done\n`);

  // Display Kanban view
  const { columns } = await kit.getKanbanView(board.id);
  
  console.log('═'.repeat(60));
  console.log('📊 KANBAN BOARD: ' + board.name);
  console.log('═'.repeat(60));

  const statusEmoji = {
    backlog: '📥',
    todo: '📋',
    in_progress: '🔨',
    review: '👀',
    done: '✅'
  };

  for (const [status, items] of Object.entries(columns)) {
    const emoji = statusEmoji[status] || '📌';
    console.log(`\n${emoji} ${status.toUpperCase()} (${items.length})`);
    console.log('─'.repeat(40));
    
    if (items.length === 0) {
      console.log('   (empty)');
    } else {
      for (const ticket of items) {
        const priority = ticket.priority === 'high' ? '🔴' : 
                         ticket.priority === 'medium' ? '🟡' : '🟢';
        const labels = ticket.labels.length > 0 ? ` [${ticket.labels.join(', ')}]` : '';
        console.log(`   ${priority} ${ticket.title}${labels}`);
      }
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('🎉 Done! You just built a working Kanban board.\n');
  console.log('Next steps:');
  console.log('  • Try the REST API example: cd ../02-rest-api');
  console.log('  • Try the React example: cd ../03-react-kanban');
  console.log('  • Read the docs: https://github.com/Kiara-02-Lab-OW/ticket.api');
}

main().catch(console.error);
