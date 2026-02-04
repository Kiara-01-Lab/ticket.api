## Killing Tier 1 Pain Points with ticket.api

---

### Pain #1: Vendor Follow-Up Black Hole

**Problem:** No single view of who's ghosting you this week.

**Solution:** Each vendor = ticket. Custom workflow tracks response state. Search surfaces stale tickets.

```javascript
// Vendor workflow
const VENDOR_WORKFLOW = {
  id: 'vendor-management',
  name: 'Vendor Pipeline',
  states: [
    'researching',      // Gathering options
    'contacted',        // Initial outreach sent
    'awaiting_response', // Ball in their court
    'proposal_received', // They responded with quote
    'client_review',    // Waiting on client decision
    'negotiating',      // Back and forth on terms
    'booked',           // Contract signed, deposit paid
    'confirmed',        // Re-confirmed closer to date
    'completed',        // Event done, final payment made
    'declined',         // Didn't work out
  ],
  transitions: {
    researching: ['contacted', 'declined'],
    contacted: ['awaiting_response', 'declined'],
    awaiting_response: ['proposal_received', 'contacted', 'declined'], // Can re-contact
    proposal_received: ['client_review', 'negotiating', 'declined'],
    client_review: ['negotiating', 'booked', 'declined'],
    negotiating: ['booked', 'declined'],
    booked: ['confirmed', 'declined'],
    confirmed: ['completed'],
    completed: [],
    declined: ['researching'], // Can restart search
  },
};

// Vendor ticket schema
const vendor = await kit.createTicket({
  board_id: eventBoard.id,
  title: 'Florist - Bloom & Wild',
  priority: 'high',
  labels: ['florist', 'flowers', 'decor'],
  custom_fields: {
    // Contact
    vendor_name: 'Bloom & Wild Florals',
    contact_person: 'Maria Santos',
    email: 'maria@bloomwild.com',
    phone: '555-0123',
    instagram: '@bloomwildflorals',
    
    // Tracking
    category: 'florist',
    last_contacted: '2024-02-10',
    last_response: '2024-02-08',
    next_followup: '2024-02-15',
    response_time_days: 2,
    
    // Financials  
    quote_amount: 4500,
    deposit_amount: 1500,
    deposit_due: '2024-03-01',
    deposit_paid: false,
    balance_due: '2024-06-01',
    balance_paid: false,
    
    // Dates
    final_count_due: '2024-05-15',
    setup_time: '10:00 AM',
    setup_duration_hours: 3,
  },
});
```

**The Killer Query: "Who's Ghosting Me?"**

```javascript
// API endpoint: GET /api/events/:eventId/vendors/stale
async function getStaleVendors(eventId, daysThreshold = 5) {
  const vendors = await kit.listTickets({ board_id: eventId });
  
  const now = new Date();
  const stale = [];
  
  for (const vendor of vendors) {
    const { last_contacted, last_response } = vendor.custom_fields;
    
    // In "awaiting_response" state
    if (vendor.status === 'awaiting_response') {
      const lastContact = new Date(last_contacted);
      const daysSince = Math.floor((now - lastContact) / (1000 * 60 * 60 * 24));
      
      if (daysSince >= daysThreshold) {
        stale.push({
          ...vendor,
          days_waiting: daysSince,
          suggested_action: daysSince > 10 ? 'escalate_or_replace' : 'follow_up',
        });
      }
    }
  }
  
  // Sort by longest waiting
  return stale.sort((a, b) => b.days_waiting - a.days_waiting);
}

// API endpoint: GET /api/vendors/followups-this-week
async function getFollowupsThisWeek() {
  const allEvents = await kit.listBoards();
  const followups = [];
  
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  
  for (const event of allEvents) {
    const vendors = await kit.listTickets({ board_id: event.id });
    
    for (const vendor of vendors) {
      const nextFollowup = new Date(vendor.custom_fields.next_followup);
      
      if (nextFollowup <= weekFromNow) {
        followups.push({
          event_name: event.name,
          event_date: event.custom_fields?.event_date,
          vendor,
          followup_date: vendor.custom_fields.next_followup,
          days_until: Math.ceil((nextFollowup - new Date()) / (1000 * 60 * 60 * 24)),
        });
      }
    }
  }
  
  return followups.sort((a, b) => a.days_until - b.days_until);
}
```

**Dashboard View: Vendor Status at a Glance**

```javascript
// API endpoint: GET /api/events/:eventId/vendor-dashboard
async function getVendorDashboard(eventId) {
  const { columns } = await kit.getKanbanView(eventId);
  
  return {
    summary: {
      total: Object.values(columns).flat().length,
      needs_attention: (columns.awaiting_response?.length || 0) + 
                       (columns.contacted?.length || 0),
      booked: (columns.booked?.length || 0) + (columns.confirmed?.length || 0),
      pending_client: columns.client_review?.length || 0,
    },
    
    // Red alert: no response in 7+ days
    ghosting: columns.awaiting_response?.filter(v => {
      const days = daysSince(v.custom_fields.last_contacted);
      return days >= 7;
    }) || [],
    
    // Yellow alert: followup due this week
    followup_due: Object.values(columns).flat().filter(v => {
      const followup = new Date(v.custom_fields.next_followup);
      return followup <= addDays(new Date(), 7);
    }),
    
    // Deposits due soon
    deposits_due: Object.values(columns).flat().filter(v => {
      const due = new Date(v.custom_fields.deposit_due);
      return !v.custom_fields.deposit_paid && due <= addDays(new Date(), 14);
    }),
    
    columns,
  };
}
```

---

### Pain #2: "What's Waiting on the Client" Invisibility

**Problem:** Can't easily show clients the 7 decisions blocking progress.

**Solution:** Separate "decision" tickets with client-facing workflow. One API call = client to-do list.

```javascript
// Decision workflow (simple, client-friendly)
const DECISION_WORKFLOW = {
  id: 'client-decision',
  name: 'Client Decision',
  states: [
    'drafting',           // Planner preparing options
    'ready_for_review',   // Sent to client
    'client_reviewing',   // Client acknowledged, thinking
    'needs_discussion',   // Client has questions
    'approved',           // Client decided
    'declined',           // Client said no to all options
  ],
  transitions: {
    drafting: ['ready_for_review'],
    ready_for_review: ['client_reviewing', 'approved', 'needs_discussion'],
    client_reviewing: ['approved', 'needs_discussion', 'declined'],
    needs_discussion: ['ready_for_review', 'approved', 'declined'],
    approved: [],
    declined: ['drafting'], // Start over with new options
  },
};

// Decision ticket schema
const decision = await kit.createTicket({
  board_id: decisionsBoard.id,
  title: 'Centerpiece Style Selection',
  priority: 'high',
  labels: ['florals', 'decor', 'visual'],
  custom_fields: {
    category: 'florals',
    description: 'Choose between 3 centerpiece styles for reception tables',
    
    // Options presented
    options: [
      { id: 'a', name: 'Tall dramatic', image_url: '...', cost: 150 },
      { id: 'b', name: 'Low lush', image_url: '...', cost: 120 },
      { id: 'c', name: 'Mixed heights', image_url: '...', cost: 135 },
    ],
    
    // Tracking
    sent_to_client: '2024-02-10',
    deadline: '2024-02-20',
    days_until_deadline: null, // Computed
    
    // Dependencies
    blocks: ['florist-final-order', 'rental-table-selection'],
    blocked_by: ['venue-table-count-confirmed'],
    
    // Impact
    budget_impact: 'medium',
    timeline_impact: 'Florist needs 8 weeks lead time',
    
    // Decision record (filled when approved)
    selected_option: null,
    decided_by: null,
    decided_at: null,
    decision_notes: null,
  },
});
```

**The Killer Query: Client To-Do List**

```javascript
// API endpoint: GET /api/events/:eventId/client-decisions
// This is what you EMAIL to the client or show in a portal
async function getClientDecisionQueue(eventId) {
  const decisions = await kit.listTickets({ 
    board_id: eventId,
    // Filter to decision tickets only
  });
  
  const pending = decisions.filter(d => 
    ['ready_for_review', 'client_reviewing', 'needs_discussion'].includes(d.status)
  );
  
  const now = new Date();
  
  return {
    summary: {
      total_pending: pending.length,
      urgent: pending.filter(d => {
        const deadline = new Date(d.custom_fields.deadline);
        return (deadline - now) / (1000 * 60 * 60 * 24) <= 3;
      }).length,
      overdue: pending.filter(d => new Date(d.custom_fields.deadline) < now).length,
    },
    
    // Sorted by deadline, urgent first
    decisions: pending
      .map(d => ({
        id: d.id,
        title: d.title,
        category: d.custom_fields.category,
        description: d.custom_fields.description,
        options: d.custom_fields.options,
        deadline: d.custom_fields.deadline,
        days_remaining: Math.ceil(
          (new Date(d.custom_fields.deadline) - now) / (1000 * 60 * 60 * 24)
        ),
        status: d.status,
        why_it_matters: d.custom_fields.timeline_impact,
        blocks_count: d.custom_fields.blocks?.length || 0,
      }))
      .sort((a, b) => a.days_remaining - b.days_remaining),
  };
}

// Client-friendly email/portal view
function formatClientEmail(decisions) {
  const { summary, decisions: items } = decisions;
  
  let email = `## Decisions Needed from You\n\n`;
  email += `**${summary.total_pending}** decisions pending`;
  
  if (summary.overdue > 0) {
    email += ` (⚠️ ${summary.overdue} overdue!)`;
  }
  
  email += `\n\n`;
  
  for (const d of items) {
    const urgency = d.days_remaining <= 0 ? '🔴 OVERDUE' :
                    d.days_remaining <= 3 ? '🟠 Due soon' : '🟢';
    
    email += `### ${urgency} ${d.title}\n`;
    email += `${d.description}\n`;
    email += `**Deadline:** ${d.deadline} (${d.days_remaining} days)\n`;
    
    if (d.why_it_matters) {
      email += `**Why it matters:** ${d.why_it_matters}\n`;
    }
    
    email += `\n---\n\n`;
  }
  
  return email;
}
```

**Blocking Visualization**

```javascript
// Show what's stuck because client hasn't decided
async function getBlockedByClientDecisions(eventId) {
  const allTickets = await kit.listTickets({ board_id: eventId });
  
  const pendingDecisions = allTickets.filter(t => 
    t.custom_fields.type === 'decision' &&
    !['approved', 'declined'].includes(t.status)
  );
  
  const blocked = [];
  
  for (const decision of pendingDecisions) {
    const blockedTasks = allTickets.filter(t =>
      t.custom_fields.blocked_by?.includes(decision.id)
    );
    
    if (blockedTasks.length > 0) {
      blocked.push({
        decision: {
          id: decision.id,
          title: decision.title,
          deadline: decision.custom_fields.deadline,
        },
        blocking: blockedTasks.map(t => ({
          id: t.id,
          title: t.title,
          type: t.custom_fields.type,
        })),
        impact: `Blocking ${blockedTasks.length} task(s)`,
      });
    }
  }
  
  return blocked.sort((a, b) => b.blocking.length - a.blocking.length);
}
```

---

### Pain #3: Client Approval Amnesia

**Problem:** "You never told me that!" — No audit trail.

**Solution:** Activity log + comments + approval snapshots. Every change recorded with timestamp and actor.

```javascript
// Record approval with full context
async function recordClientApproval(ticketId, approval, clientId) {
  const ticket = await kit.getTicket(ticketId);
  
  // 1. Move to approved status (creates activity log entry)
  await kit.moveTicket(ticketId, 'approved', clientId);
  
  // 2. Update with decision details
  await kit.updateTicket(ticketId, {
    custom_fields: {
      ...ticket.custom_fields,
      selected_option: approval.selected_option,
      decided_by: clientId,
      decided_at: new Date().toISOString(),
      decision_notes: approval.notes,
      
      // Snapshot what they saw when deciding
      approval_snapshot: {
        options_presented: ticket.custom_fields.options,
        prices_at_approval: ticket.custom_fields.options.map(o => ({
          id: o.id,
          cost: o.cost,
        })),
        timestamp: new Date().toISOString(),
      },
    },
  }, clientId);
  
  // 3. Add formal comment as permanent record
  await kit.addComment(
    ticketId,
    `✅ **APPROVED** by ${clientId}\n\n` +
    `**Selected:** ${approval.selected_option}\n` +
    `**Notes:** ${approval.notes || 'None'}\n\n` +
    `_This approval was recorded on ${new Date().toLocaleString()}_`,
    'system'
  );
  
  return kit.getTicket(ticketId);
}

// Get full decision history for a ticket
async function getDecisionHistory(ticketId) {
  const ticket = await kit.getTicket(ticketId);
  const activity = await kit.getActivity(ticketId);
  const comments = await kit.listComments(ticketId);
  
  // Build timeline of everything that happened
  const timeline = [];
  
  // Add activity events
  for (const event of activity) {
    timeline.push({
      type: 'activity',
      timestamp: event.timestamp,
      actor: event.actor,
      action: event.action,
      details: event.details,
    });
  }
  
  // Add comments
  for (const comment of comments) {
    timeline.push({
      type: 'comment',
      timestamp: comment.created_at,
      actor: comment.author,
      content: comment.content,
    });
  }
  
  // Sort chronologically
  timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  return {
    ticket,
    current_status: ticket.status,
    approval: ticket.custom_fields.approval_snapshot,
    timeline,
  };
}
```

**Approval Proof Generator**

```javascript
// Generate PDF-ready approval record for CYA
async function generateApprovalRecord(ticketId) {
  const { ticket, timeline } = await getDecisionHistory(ticketId);
  const cf = ticket.custom_fields;
  
  return {
    title: ticket.title,
    category: cf.category,
    
    decision: {
      selected: cf.selected_option,
      decided_by: cf.decided_by,
      decided_at: cf.decided_at,
      notes: cf.decision_notes,
    },
    
    // What they were shown
    options_presented: cf.approval_snapshot?.options_presented || cf.options,
    
    // Full audit trail
    audit_trail: timeline.map(e => ({
      timestamp: e.timestamp,
      who: e.actor,
      what: e.type === 'comment' ? `Comment: ${e.content.slice(0, 100)}...` :
            `${e.action}: ${JSON.stringify(e.details)}`,
    })),
    
    // Signature line
    generated_at: new Date().toISOString(),
    verification_hash: computeHash(ticket), // For tamper evidence
  };
}

// API endpoint: GET /api/decisions/:id/approval-record
// Returns JSON suitable for PDF generation or email
```

**"What Did We Agree On?" Dashboard**

```javascript
// API endpoint: GET /api/events/:eventId/approved-decisions
async function getApprovedDecisions(eventId) {
  const decisions = await kit.listTickets({ board_id: eventId });
  
  const approved = decisions
    .filter(d => d.status === 'approved')
    .map(d => ({
      id: d.id,
      title: d.title,
      category: d.custom_fields.category,
      selected: d.custom_fields.selected_option,
      decided_by: d.custom_fields.decided_by,
      decided_at: d.custom_fields.decided_at,
      cost: d.custom_fields.options?.find(
        o => o.id === d.custom_fields.selected_option
      )?.cost,
    }));
  
  // Group by category
  const byCategory = {};
  for (const d of approved) {
    if (!byCategory[d.category]) byCategory[d.category] = [];
    byCategory[d.category].push(d);
  }
  
  return {
    total_approved: approved.length,
    total_cost: approved.reduce((sum, d) => sum + (d.cost || 0), 0),
    by_category: byCategory,
    all: approved,
  };
}
```

---

### Pain #4: Contact Info Scattered Everywhere

**Problem:** Vendor details across emails, texts, spreadsheets, business cards, Instagram DMs.

**Solution:** Vendor = ticket with structured contact fields. One source of truth, always accessible.

```javascript
// Comprehensive vendor contact schema
const vendorContactFields = {
  // Primary contact
  vendor_name: 'Bloom & Wild Florals',
  contact_person: 'Maria Santos',
  contact_title: 'Owner',
  
  // All the ways to reach them
  channels: {
    email: 'maria@bloomwild.com',
    phone: '555-0123',
    phone_type: 'mobile', // mobile, office, after_hours
    text_ok: true,
    
    // Secondary contact
    email_secondary: 'orders@bloomwild.com',
    phone_secondary: '555-0100',
    
    // Social (where you actually found them)
    instagram: '@bloomwildflorals',
    website: 'https://bloomwild.com',
    
    // Emergency/day-of
    emergency_phone: '555-0199',
    emergency_contact: 'Maria cell',
  },
  
  // Physical
  address: {
    street: '123 Flower Lane',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
  },
  
  // Preferences learned over time
  communication_prefs: {
    preferred_channel: 'text',
    best_times: 'Tue-Sat, 9am-5pm',
    response_time_typical: '24-48 hours',
    notes: 'Prefers text for quick questions, email for detailed requests',
  },
  
  // Business details
  business: {
    years_in_business: 12,
    insurance_expires: '2024-12-31',
    license_number: 'TX-FL-12345',
  },
};

// Quick contact lookup API
// GET /api/vendors/:id/contact
async function getVendorContact(vendorId) {
  const vendor = await kit.getTicket(vendorId);
  const cf = vendor.custom_fields;
  
  return {
    name: cf.vendor_name,
    contact: cf.contact_person,
    
    // Quick actions
    quick_contact: {
      call: cf.channels.phone,
      text: cf.channels.text_ok ? cf.channels.phone : null,
      email: cf.channels.email,
    },
    
    // Day-of emergency
    emergency: {
      phone: cf.channels.emergency_phone,
      contact: cf.channels.emergency_contact,
    },
    
    // Tips
    tip: cf.communication_prefs.notes,
    best_time: cf.communication_prefs.best_times,
  };
}
```

**Event Contact Sheet Generator**

```javascript
// Generate day-of contact sheet for entire event
// GET /api/events/:eventId/contact-sheet
async function generateContactSheet(eventId) {
  const vendors = await kit.listTickets({ board_id: eventId });
  
  // Only booked/confirmed vendors
  const active = vendors.filter(v => 
    ['booked', 'confirmed'].includes(v.status)
  );
  
  const sheet = {
    event_id: eventId,
    generated_at: new Date().toISOString(),
    
    vendors: active.map(v => ({
      category: v.custom_fields.category,
      name: v.custom_fields.vendor_name,
      contact: v.custom_fields.contact_person,
      
      // Primary
      phone: v.custom_fields.channels.phone,
      email: v.custom_fields.channels.email,
      
      // Emergency
      emergency_phone: v.custom_fields.channels.emergency_phone || v.custom_fields.channels.phone,
      
      // Day-of logistics
      arrival_time: v.custom_fields.setup_time,
      setup_location: v.custom_fields.setup_location,
      
      // Quick notes
      notes: v.custom_fields.communication_prefs?.notes,
    })),
  };
  
  // Sort by arrival time for day-of use
  sheet.vendors.sort((a, b) => {
    if (!a.arrival_time) return 1;
    if (!b.arrival_time) return -1;
    return a.arrival_time.localeCompare(b.arrival_time);
  });
  
  // Group by category for quick lookup
  sheet.by_category = {};
  for (const v of sheet.vendors) {
    if (!sheet.by_category[v.category]) {
      sheet.by_category[v.category] = [];
    }
    sheet.by_category[v.category].push(v);
  }
  
  return sheet;
}
```

**Search All Contacts Across All Events**

```javascript
// GET /api/search/vendors?q=maria
async function searchVendorsGlobal(query) {
  const allEvents = await kit.listBoards();
  const results = [];
  
  const q = query.toLowerCase();
  
  for (const event of allEvents) {
    const vendors = await kit.listTickets({ board_id: event.id });
    
    for (const v of vendors) {
      const cf = v.custom_fields;
      
      // Search across all contact fields
      const searchable = [
        cf.vendor_name,
        cf.contact_person,
        cf.channels?.email,
        cf.channels?.phone,
        cf.channels?.instagram,
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (searchable.includes(q)) {
        results.push({
          event_name: event.name,
          event_id: event.id,
          vendor: {
            id: v.id,
            name: cf.vendor_name,
            contact: cf.contact_person,
            phone: cf.channels?.phone,
            email: cf.channels?.email,
            category: cf.category,
          },
        });
      }
    }
  }
  
  return results;
}
```

---

### Pain #5: Task Overload Without Dependencies

**Problem:** 300+ tasks but no way to show "can't do X until Y is done."

**Solution:** `blocked_by` and `blocks` fields on every ticket. Dependency-aware views and alerts.

```javascript
// Task with dependency tracking
const task = await kit.createTicket({
  board_id: eventBoard.id,
  title: 'Send save-the-dates',
  priority: 'high',
  labels: ['stationery', 'milestone'],
  custom_fields: {
    type: 'task',
    category: 'stationery',
    
    // Who owns this
    owner: 'planner', // planner, client, vendor
    assigned_to: 'sarah@planner.com',
    
    // Dependencies
    blocked_by: [
      'guest-list-finalized',      // Can't send without addresses
      'save-the-date-design-approved', // Can't send without design
    ],
    blocks: [
      'collect-rsvps',
      'book-hotel-block',
    ],
    
    // Timeline
    due_date: '2024-03-15',
    ideal_start: '2024-03-01',
    estimated_hours: 4,
    
    // Status tracking
    percent_complete: 0,
    blockers_resolved: false,
  },
});
```

**Dependency Resolution Engine**

```javascript
// Check if a task can be started
async function canStartTask(taskId) {
  const task = await kit.getTicket(taskId);
  const blockedBy = task.custom_fields.blocked_by || [];
  
  if (blockedBy.length === 0) {
    return { can_start: true, blockers: [] };
  }
  
  const blockers = [];
  
  for (const blockerId of blockedBy) {
    const blocker = await kit.getTicket(blockerId);
    
    if (!blocker) {
      blockers.push({ id: blockerId, status: 'not_found', resolved: false });
      continue;
    }
    
    // Consider "done" or "approved" as resolved
    const resolved = ['done', 'approved', 'completed'].includes(blocker.status);
    
    blockers.push({
      id: blocker.id,
      title: blocker.title,
      status: blocker.status,
      resolved,
      owner: blocker.custom_fields.owner,
    });
  }
  
  return {
    can_start: blockers.every(b => b.resolved),
    blockers,
    unresolved_count: blockers.filter(b => !b.resolved).length,
  };
}

// GET /api/tasks/:id/dependencies
async function getTaskDependencies(taskId) {
  const task = await kit.getTicket(taskId);
  
  // Get what this task is waiting on
  const waitingOn = [];
  for (const id of (task.custom_fields.blocked_by || [])) {
    const blocker = await kit.getTicket(id);
    if (blocker) {
      waitingOn.push({
        id: blocker.id,
        title: blocker.title,
        status: blocker.status,
        owner: blocker.custom_fields.owner,
        due_date: blocker.custom_fields.due_date,
      });
    }
  }
  
  // Get what's waiting on this task
  const blocking = [];
  for (const id of (task.custom_fields.blocks || [])) {
    const blocked = await kit.getTicket(id);
    if (blocked) {
      blocking.push({
        id: blocked.id,
        title: blocked.title,
        status: blocked.status,
        due_date: blocked.custom_fields.due_date,
      });
    }
  }
  
  return {
    task: { id: task.id, title: task.title, status: task.status },
    waiting_on: waitingOn,
    blocking: blocking,
    can_start: waitingOn.every(t => ['done', 'approved'].includes(t.status)),
  };
}
```

**Critical Path & Ready-to-Start Views**

```javascript
// GET /api/events/:eventId/tasks/ready
// Tasks that CAN be started (all dependencies resolved)
async function getReadyTasks(eventId) {
  const tasks = await kit.listTickets({ board_id: eventId });
  
  const ready = [];
  
  for (const task of tasks) {
    // Skip completed tasks
    if (['done', 'approved', 'completed'].includes(task.status)) continue;
    
    const { can_start, blockers } = await canStartTask(task.id);
    
    if (can_start) {
      ready.push({
        ...task,
        blocks_count: task.custom_fields.blocks?.length || 0,
      });
    }
  }
  
  // Sort by: urgent priority, then by how many things they block
  return ready.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const pDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    if (pDiff !== 0) return pDiff;
    return b.blocks_count - a.blocks_count; // More blocking = higher priority
  });
}

// GET /api/events/:eventId/tasks/blocked
// Tasks that CANNOT proceed
async function getBlockedTasks(eventId) {
  const tasks = await kit.listTickets({ board_id: eventId });
  
  const blocked = [];
  
  for (const task of tasks) {
    if (['done', 'approved', 'completed'].includes(task.status)) continue;
    
    const { can_start, blockers } = await canStartTask(task.id);
    
    if (!can_start) {
      blocked.push({
        task: {
          id: task.id,
          title: task.title,
          due_date: task.custom_fields.due_date,
          owner: task.custom_fields.owner,
        },
        blocked_by: blockers.filter(b => !b.resolved),
        unresolved_count: blockers.filter(b => !b.resolved).length,
      });
    }
  }
  
  // Sort by due date (soonest first) - these are at risk
  return blocked.sort((a, b) => {
    const dateA = new Date(a.task.due_date || '9999-12-31');
    const dateB = new Date(b.task.due_date || '9999-12-31');
    return dateA - dateB;
  });
}

// GET /api/events/:eventId/critical-path
// Find the chain of dependencies that determines the earliest completion
async function getCriticalPath(eventId) {
  const tasks = await kit.listTickets({ board_id: eventId });
  
  // Build dependency graph
  const graph = new Map();
  for (const task of tasks) {
    graph.set(task.id, {
      task,
      blocked_by: task.custom_fields.blocked_by || [],
      blocks: task.custom_fields.blocks || [],
    });
  }
  
  // Find terminal tasks (nothing depends on them)
  const terminals = tasks.filter(t => 
    (t.custom_fields.blocks || []).length === 0 &&
    !['done', 'approved', 'completed'].includes(t.status)
  );
  
  // Trace back from terminals to find longest chains
  function getChainLength(taskId, visited = new Set()) {
    if (visited.has(taskId)) return 0;
    visited.add(taskId);
    
    const node = graph.get(taskId);
    if (!node) return 0;
    
    const blockedBy = node.blocked_by;
    if (blockedBy.length === 0) return 1;
    
    const maxPredecessor = Math.max(
      ...blockedBy.map(id => getChainLength(id, visited))
    );
    
    return 1 + maxPredecessor;
  }
  
  // Find the longest chain
  let longestChain = [];
  let maxLength = 0;
  
  for (const terminal of terminals) {
    const length = getChainLength(terminal.id);
    if (length > maxLength) {
      maxLength = length;
      // Reconstruct chain
      longestChain = reconstructChain(terminal.id, graph);
    }
  }
  
  return {
    length: maxLength,
    path: longestChain.map(id => {
      const node = graph.get(id);
      return {
        id,
        title: node.task.title,
        status: node.task.status,
        due_date: node.task.custom_fields.due_date,
        owner: node.task.custom_fields.owner,
      };
    }),
  };
}
```

---

## Summary: API Endpoints for Wedding Planner App

| Pain Point | Key Endpoints |
|------------|---------------|
| Vendor follow-up | `GET /vendors/stale`, `GET /vendors/followups-this-week`, `GET /events/:id/vendor-dashboard` |
| Client decisions | `GET /events/:id/client-decisions`, `GET /decisions/blocked-by`, `POST /decisions/:id/approve` |
| Approval audit | `GET /decisions/:id/history`, `GET /decisions/:id/approval-record`, `GET /events/:id/approved` |
| Contact lookup | `GET /vendors/:id/contact`, `GET /events/:id/contact-sheet`, `GET /search/vendors` |
| Dependencies | `GET /tasks/:id/dependencies`, `GET /events/:id/tasks/ready`, `GET /events/:id/tasks/blocked`, `GET /events/:id/critical-path` |
