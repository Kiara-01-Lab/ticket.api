#!/usr/bin/env node

/**
 * Demo script for the REST API
 * 
 * Start the server first: npm start
 * Then run this: npm run demo
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function api(method, path, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': 'demo-user'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const res = await fetch(`${BASE_URL}${path}`, options);
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  
  if (res.status === 204) return null;
  return res.json();
}

async function demo() {
  console.log('🎫 ticket.api REST API Demo\n');
  console.log(`📡 API: ${BASE_URL}\n`);
  console.log('─'.repeat(50));

  // 1. Create a board
  console.log('\n1️⃣  Creating a board...');
  const board = await api('POST', '/boards', {
    name: 'Demo Project',
    description: 'A demo board created via the API',
    workflow_id: 'kanban'
  });
  console.log(`   ✅ Created: "${board.name}" (${board.id})`);

  // 2. Create some tickets
  console.log('\n2️⃣  Creating tickets...');
  
  const ticketsData = [
    { title: 'Design homepage mockup', priority: 'high', labels: ['design', 'frontend'] },
    { title: 'Set up CI/CD pipeline', priority: 'medium', labels: ['devops'] },
    { title: 'Write API documentation', priority: 'medium', labels: ['docs'] },
    { title: 'Fix login redirect bug', priority: 'urgent', labels: ['bug', 'auth'] },
    { title: 'Add dark mode support', priority: 'low', labels: ['feature', 'frontend'] },
  ];
  
  const tickets = [];
  for (const data of ticketsData) {
    const ticket = await api('POST', `/boards/${board.id}/tickets`, data);
    tickets.push(ticket);
    console.log(`   ✅ ${ticket.title} [${ticket.priority}]`);
  }

  // 3. Move tickets through workflow
  console.log('\n3️⃣  Moving tickets through workflow...');
  
  // Move first ticket to in_progress
  await api('POST', `/tickets/${tickets[0].id}/move`, { status: 'todo' });
  await api('POST', `/tickets/${tickets[0].id}/move`, { status: 'in_progress' });
  console.log(`   ➡️  "${tickets[0].title}" → in_progress`);
  
  // Move second ticket to todo
  await api('POST', `/tickets/${tickets[1].id}/move`, { status: 'todo' });
  console.log(`   ➡️  "${tickets[1].title}" → todo`);
  
  // Move bug to in_progress (urgent!)
  await api('POST', `/tickets/${tickets[3].id}/move`, { status: 'todo' });
  await api('POST', `/tickets/${tickets[3].id}/move`, { status: 'in_progress' });
  console.log(`   ➡️  "${tickets[3].title}" → in_progress`);
  
  // Move third ticket all the way to done
  await api('POST', `/tickets/${tickets[2].id}/move`, { status: 'todo' });
  await api('POST', `/tickets/${tickets[2].id}/move`, { status: 'in_progress' });
  await api('POST', `/tickets/${tickets[2].id}/move`, { status: 'review' });
  await api('POST', `/tickets/${tickets[2].id}/move`, { status: 'done' });
  console.log(`   ➡️  "${tickets[2].title}" → done`);

  // 4. Assign tickets
  console.log('\n4️⃣  Assigning tickets...');
  await api('POST', `/tickets/${tickets[0].id}/assign`, { assignees: ['alice', 'bob'] });
  console.log(`   👤 "${tickets[0].title}" → alice, bob`);
  
  await api('POST', `/tickets/${tickets[3].id}/assign`, { assignees: ['charlie'] });
  console.log(`   👤 "${tickets[3].title}" → charlie`);

  // 5. Add comments
  console.log('\n5️⃣  Adding comments...');
  const comment = await api('POST', `/tickets/${tickets[3].id}/comments`, {
    content: 'Found the root cause - it\'s a redirect loop in the OAuth callback.'
  });
  console.log(`   💬 Added comment to bug ticket`);
  
  await api('POST', `/tickets/${tickets[3].id}/comments`, {
    content: 'Great find! Can you push a fix today?',
    parent_id: comment.id
  });
  console.log(`   💬 Added reply`);

  // 6. Create subtasks
  console.log('\n6️⃣  Creating subtasks...');
  await api('POST', `/tickets/${tickets[0].id}/subtasks`, { title: 'Create wireframes' });
  await api('POST', `/tickets/${tickets[0].id}/subtasks`, { title: 'Design hero section' });
  await api('POST', `/tickets/${tickets[0].id}/subtasks`, { title: 'Design navigation' });
  console.log(`   📦 Added 3 subtasks to "${tickets[0].title}"`);

  // 7. Search
  console.log('\n7️⃣  Searching tickets...');
  const bugs = await api('GET', `/boards/${board.id}/search?q=label:bug`);
  console.log(`   🔍 Found ${bugs.results.length} bug(s)`);
  
  const urgent = await api('GET', `/boards/${board.id}/search?q=priority:urgent`);
  console.log(`   🔍 Found ${urgent.results.length} urgent ticket(s)`);

  // 8. Get Kanban view
  console.log('\n8️⃣  Fetching Kanban view...');
  const kanban = await api('GET', `/boards/${board.id}/kanban`);
  
  console.log('\n' + '═'.repeat(50));
  console.log('📊 KANBAN BOARD: ' + kanban.board.name);
  console.log('═'.repeat(50));
  
  const statusEmoji = {
    backlog: '📥',
    todo: '📋',
    in_progress: '🔨',
    review: '👀',
    done: '✅'
  };
  
  for (const [status, items] of Object.entries(kanban.columns)) {
    const emoji = statusEmoji[status] || '📌';
    console.log(`\n${emoji} ${status.toUpperCase()} (${items.length})`);
    
    if (items.length > 0) {
      for (const ticket of items) {
        const priority = ticket.priority === 'urgent' ? '🔴' :
                         ticket.priority === 'high' ? '🟠' : 
                         ticket.priority === 'medium' ? '🟡' : '🟢';
        const assignees = ticket.assignees.length > 0 ? ` @${ticket.assignees.join(', @')}` : '';
        console.log(`   ${priority} ${ticket.title}${assignees}`);
      }
    }
  }

  // 9. Export data
  console.log('\n\n9️⃣  Exporting data...');
  const exported = await api('GET', '/export');
  console.log(`   📤 Exported ${exported.boards.length} board(s), ${exported.tickets.length} ticket(s)`);

  console.log('\n' + '═'.repeat(50));
  console.log('🎉 Demo complete!');
  console.log('═'.repeat(50));
  console.log('\nUseful commands:');
  console.log(`  curl ${BASE_URL}/boards`);
  console.log(`  curl ${BASE_URL}/boards/${board.id}/kanban`);
  console.log(`  curl ${BASE_URL}/tickets/${tickets[0].id}`);
}

demo().catch(err => {
  console.error('❌ Error:', err.message);
  console.error('\nMake sure the server is running: npm start');
  process.exit(1);
});
