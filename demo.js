/**
 * TicketKit Usage Examples
 *
 * Run: node demo.js
 */

const { TicketKit, WORKFLOWS } = require('./index.js');

async function main() {
  console.log('🎫 TicketKit Demo\n');
  
  // Initialize
  const kit = await TicketKit.create();
  
  // Listen to events
  kit.on('ticket:created', (t) => console.log(`  ✅ Created: ${t.title}`));
  kit.on('ticket:updated', ({ ticket, changes }) => {
    console.log(`  📝 Updated: ${ticket.title}`, Object.keys(changes).join(', '));
  });

  // ========================================
  // 1. Create a board
  // ========================================
  console.log('1️⃣  Creating board...');
  const board = await kit.createBoard({
    name: 'My Project',
    description: 'A sample project board',
    workflow_id: 'kanban'
  });
  console.log(`   Board: ${board.name} (${board.id})\n`);

  // ========================================
  // 2. Create some tickets
  // ========================================
  console.log('2️⃣  Creating tickets...');
  
  const ticket1 = await kit.createTicket({
    board_id: board.id,
    title: 'Setup CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing',
    priority: 'high',
    labels: ['devops', 'infrastructure']
  }, 'alice');

  const ticket2 = await kit.createTicket({
    board_id: board.id,
    title: 'Design landing page',
    description: 'Create mockups for the new landing page',
    priority: 'medium',
    labels: ['design', 'frontend']
  }, 'bob');

  const ticket3 = await kit.createTicket({
    board_id: board.id,
    title: 'Fix login bug',
    description: 'Users cannot login with SSO',
    priority: 'urgent',
    labels: ['bug', 'auth']
  }, 'alice');

  console.log('');

  // ========================================
  // 3. Move tickets through workflow
  // ========================================
  console.log('3️⃣  Moving tickets through workflow...');
  
  await kit.moveTicket(ticket3.id, 'todo', 'alice');
  await kit.moveTicket(ticket3.id, 'in_progress', 'alice');
  
  await kit.moveTicket(ticket1.id, 'todo', 'bob');
  
  console.log('');

  // ========================================
  // 4. Assign tickets
  // ========================================
  console.log('4️⃣  Assigning tickets...');
  
  await kit.assignTicket(ticket3.id, ['charlie'], 'alice');
  await kit.assignTicket(ticket1.id, ['dave', 'eve'], 'bob');
  
  console.log('');

  // ========================================
  // 5. Add comments
  // ========================================
  console.log('5️⃣  Adding comments...');
  
  const comment1 = await kit.addComment(ticket3.id, 'Found the issue - OAuth callback URL was wrong', 'charlie');
  console.log(`   💬 ${comment1.author}: ${comment1.content}`);
  
  const reply = await kit.replyToComment(ticket3.id, comment1.id, 'Great find! Can you fix it today?', 'alice');
  console.log(`   ↳ ${reply.author}: ${reply.content}`);
  
  console.log('');

  // ========================================
  // 6. Create subtasks
  // ========================================
  console.log('6️⃣  Creating subtasks...');
  
  const subtask1 = await kit.createSubtask(ticket1.id, {
    title: 'Write test workflow file',
    priority: 'medium'
  }, 'dave');
  
  const subtask2 = await kit.createSubtask(ticket1.id, {
    title: 'Add deployment step',
    priority: 'medium'
  }, 'eve');
  
  const subtasks = await kit.getSubtasks(ticket1.id);
  console.log(`   Parent: ${ticket1.title}`);
  subtasks.forEach(st => console.log(`   └── ${st.title}`));
  
  console.log('');

  // ========================================
  // 7. View kanban board
  // ========================================
  console.log('7️⃣  Kanban View:');
  
  const kanban = await kit.getKanbanView(board.id);
  for (const [status, tickets] of Object.entries(kanban.columns)) {
    const count = tickets.length;
    const names = tickets.map(t => t.title).join(', ') || '(empty)';
    console.log(`   ${status.padEnd(12)} [${count}] ${names}`);
  }
  
  console.log('');

  // ========================================
  // 8. Search tickets
  // ========================================
  console.log('8️⃣  Search examples:');
  
  const highPriority = await kit.search(board.id, 'priority:high');
  console.log(`   priority:high → ${highPriority.map(t => t.title).join(', ')}`);
  
  const bugs = await kit.search(board.id, 'label:bug');
  console.log(`   label:bug → ${bugs.map(t => t.title).join(', ')}`);
  
  const inProgress = await kit.search(board.id, 'status:in_progress');
  console.log(`   status:in_progress → ${inProgress.map(t => t.title).join(', ')}`);
  
  console.log('');

  // ========================================
  // 9. Activity feed
  // ========================================
  console.log('9️⃣  Activity feed for bug ticket:');
  
  const activity = await kit.getActivity(ticket3.id, 5);
  activity.reverse().forEach(a => {
    console.log(`   ${a.actor} ${a.action} @ ${a.created_at.split('T')[0]}`);
  });
  
  console.log('');

  // ========================================
  // 10. Export data
  // ========================================
  console.log('🔟 Export:');
  const exported = await kit.export();
  console.log(`   ${exported.boards.length} boards, ${exported.tickets.length} tickets`);
  
  // Cleanup
  await kit.close();
  
  console.log('\n✨ Demo complete!');
}

main().catch(console.error);
