/**
 * Wedding Planner API
 *
 * A vertical SaaS example built with TicketKit
 * Solves top 5 pain points for wedding/event planners
 */

const express = require('express');
const cors = require('cors');
const { TicketKit } = require('../../../../index.js'); // Local TicketKit
const { VENDOR_WORKFLOW, DECISION_WORKFLOW } = require('./workflows');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize TicketKit (will be set in setup)
let kit;

// ============================================================================
// SETUP & SEEDING
// ============================================================================

async function setup() {
  // Initialize TicketKit with in-memory database
  kit = await TicketKit.create({ dbPath: ':memory:' });

  // Register custom workflows
  await kit.createWorkflow(VENDOR_WORKFLOW);
  await kit.createWorkflow(DECISION_WORKFLOW);

  console.log('✅ Custom workflows registered');

  // Create sample event
  const event = await kit.createBoard({
    name: 'Sarah & Mike Wedding - June 15, 2024',
    workflow_id: 'vendor-management',
  });
  console.log(`✅ Sample event created: ${event.id}`);

  // Seed sample vendors
  await seedSampleData(event.id);
  console.log('✅ Sample data seeded');
}

async function seedSampleData(eventId) {
  const now = new Date();
  const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  const daysFromNow = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  // Vendor 1: Ghosting florist
  await kit.createTicket({
    board_id: eventId,
    title: 'Florist - Bloom & Wild',
    description: 'Contacted for floral arrangements, awaiting proposal',
    status: 'awaiting_response',
    priority: 'high',
    labels: ['florist', 'flowers', 'decor'],
    custom_fields: {
      type: 'vendor',
      vendor_name: 'Bloom & Wild Florals',
      contact_person: 'Maria Santos',
      email: 'maria@bloomwild.com',
      phone: '555-0123',
      category: 'florist',
      last_contacted: daysAgo(8),
      last_response: daysAgo(10),
      next_followup: daysAgo(1),
      quote_amount: 4500,
    },
  });

  // Vendor 2: Booked photographer
  await kit.createTicket({
    board_id: eventId,
    title: 'Photographer - Lens & Light',
    description: 'Booked for wedding day photography, deposit paid',
    status: 'booked',
    priority: 'high',
    labels: ['photographer', 'media'],
    custom_fields: {
      type: 'vendor',
      vendor_name: 'Lens & Light Photography',
      contact_person: 'David Chen',
      email: 'david@lensandlight.com',
      phone: '555-0456',
      category: 'photographer',
      last_contacted: daysAgo(30),
      quote_amount: 3500,
      deposit_amount: 1000,
      deposit_paid: true,
      deposit_due: daysAgo(15),
      balance_due: daysFromNow(45),
    },
  });

  // Vendor 3: Needs followup caterer
  await kit.createTicket({
    board_id: eventId,
    title: 'Caterer - Delicious Affairs',
    description: 'Initial outreach sent, waiting for menu options and pricing',
    status: 'contacted',
    priority: 'urgent',
    labels: ['catering', 'food'],
    custom_fields: {
      type: 'vendor',
      vendor_name: 'Delicious Affairs Catering',
      contact_person: 'Chef Rodriguez',
      email: 'chef@deliciousaffairs.com',
      phone: '555-0789',
      category: 'catering',
      last_contacted: daysAgo(3),
      next_followup: daysFromNow(2),
      quote_amount: 8500,
    },
  });

  // Decision 1: Pending centerpiece choice
  const decisionsBoard = await kit.createBoard({
    name: 'Decisions - Sarah & Mike',
    workflow_id: 'client-decision',
  });

  await kit.createTicket({
    board_id: decisionsBoard.id,
    title: 'Centerpiece Style Selection',
    description: 'Client needs to choose between three centerpiece options',
    status: 'client_reviewing',
    priority: 'high',
    labels: ['florals', 'decor'],
    custom_fields: {
      type: 'decision',
      category: 'florals',
      description: 'Choose between 3 centerpiece styles for reception tables',
      options: [
        { id: 'tall', name: 'Tall dramatic', cost: 150 },
        { id: 'low', name: 'Low lush', cost: 120 },
        { id: 'mixed', name: 'Mixed heights', cost: 135 },
      ],
      sent_to_client: daysAgo(5),
      deadline: daysFromNow(7),
      blocks: ['florist-final-order'],
    },
  });
}

// ============================================================================
// EVENT MANAGEMENT
// ============================================================================

app.get('/api/events', async (req, res) => {
  try {
    const events = await kit.listBoards();
    // Only return vendor-management boards (actual events), not decision boards
    const vendorBoards = events.filter(e => e.workflow_id === 'vendor-management');
    res.json(vendorBoards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { name, event_date, client_name, workflow_id } = req.body;
    let event = await kit.createBoard({
      name,
      workflow_id: workflow_id || 'vendor-management'
    });

    // Store event metadata if provided
    if (event_date || client_name) {
      await kit.updateBoard(event.id, {
        custom_fields: { event_date, client_name },
      });
      // Fetch the updated board to return complete data
      event = await kit.getBoard(event.id);
    }

    res.json(event);
  } catch (error) {
    console.error('Error creating board:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all boards (including decisions boards)
app.get('/api/boards', async (req, res) => {
  try {
    const boards = await kit.listBoards();
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// VENDOR MANAGEMENT (Pain Point #1)
// ============================================================================

// Get all vendors for an event
app.get('/api/events/:eventId/vendors', async (req, res) => {
  try {
    // listTickets now supports string board_id parameter
    const tickets = await kit.listTickets(req.params.eventId);
    const vendors = tickets.filter(v => v.custom_fields && v.custom_fields.type === 'vendor');
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new vendor
app.post('/api/events/:eventId/vendors', async (req, res) => {
  try {
    const vendor = await kit.createTicket({
      board_id: req.params.eventId,
      title: req.body.title,
      description: req.body.description || '',
      status: 'researching',
      priority: req.body.priority || 'medium',
      labels: req.body.labels || [],
      custom_fields: {
        type: 'vendor',
        ...req.body.custom_fields,
        last_contacted: new Date().toISOString(),
      },
    });
    res.json(vendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single vendor
app.get('/api/vendors/:vendorId', async (req, res) => {
  try {
    const vendor = await kit.getTicket(req.params.vendorId);
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update vendor
app.patch('/api/vendors/:vendorId', async (req, res) => {
  try {
    const vendor = await kit.updateTicket(req.params.vendorId, req.body);
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete vendor
app.delete('/api/vendors/:vendorId', async (req, res) => {
  try {
    await kit.deleteTicket(req.params.vendorId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment to vendor
app.post('/api/vendors/:vendorId/comments', async (req, res) => {
  try {
    const { author, text } = req.body;
    const comment = await kit.addComment(req.params.vendorId, author, text);
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// THE KILLER QUERY: Who's ghosting me?
app.get('/api/events/:eventId/vendors/stale', async (req, res) => {
  try {
    const daysThreshold = parseInt(req.query.days) || 5;
    const vendors = await kit.listTickets(req.params.eventId);

    const now = new Date();
    const stale = [];

    for (const vendor of vendors) {
      if (vendor.custom_fields.type !== 'vendor') continue;
      if (vendor.status !== 'awaiting_response') continue;

      const lastContact = new Date(vendor.custom_fields.last_contacted);
      const daysSince = Math.floor((now - lastContact) / (1000 * 60 * 60 * 24));

      if (daysSince >= daysThreshold) {
        stale.push({
          ...vendor,
          days_waiting: daysSince,
          suggested_action: daysSince > 10 ? 'escalate_or_replace' : 'follow_up',
        });
      }
    }

    // Sort by longest waiting
    stale.sort((a, b) => b.days_waiting - a.days_waiting);

    res.json({
      threshold_days: daysThreshold,
      stale_count: stale.length,
      vendors: stale,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vendor dashboard
app.get('/api/events/:eventId/vendor-dashboard', async (req, res) => {
  try {
    const kanban = await kit.getKanbanView(req.params.eventId);
    const vendors = await kit.listTickets(req.params.eventId);

    const vendorList = vendors.filter(v => v.custom_fields.type === 'vendor');

    // Calculate summary stats
    const summary = {
      total: vendorList.length,
      needs_attention: vendorList.filter(v =>
        ['awaiting_response', 'contacted'].includes(v.status)
      ).length,
      booked: vendorList.filter(v =>
        ['booked', 'confirmed'].includes(v.status)
      ).length,
      pending_client: vendorList.filter(v =>
        v.status === 'client_review'
      ).length,
    };

    // Find ghosting vendors (7+ days no response)
    const now = new Date();
    const ghosting = vendorList.filter(v => {
      if (v.status !== 'awaiting_response') return false;
      const lastContact = new Date(v.custom_fields.last_contacted);
      const daysSince = (now - lastContact) / (1000 * 60 * 60 * 24);
      return daysSince >= 7;
    });

    // Followups due this week
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const followupDue = vendorList.filter(v => {
      const followup = new Date(v.custom_fields.next_followup);
      return followup <= weekFromNow;
    });

    // Deposits due soon (14 days)
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const depositsDue = vendorList.filter(v => {
      if (v.custom_fields.deposit_paid) return false;
      if (!v.custom_fields.deposit_due) return false;
      const due = new Date(v.custom_fields.deposit_due);
      return due <= twoWeeksFromNow;
    });

    res.json({
      summary,
      alerts: {
        ghosting: ghosting.length,
        followup_due: followupDue.length,
        deposits_due: depositsDue.length,
      },
      ghosting,
      followup_due: followupDue,
      deposits_due: depositsDue,
      kanban,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats for an event
app.get('/api/events/:eventId/stats', async (req, res) => {
  try {
    const tickets = await kit.listTickets(req.params.eventId);
    const vendorTickets = tickets.filter(v => v.custom_fields && v.custom_fields.type === 'vendor');

    // Get all boards to find decisions board
    const boards = await kit.listBoards();
    const decisionsBoard = boards.find(b => b.workflow_id === 'client-decision');
    let pendingDecisions = 0;

    if (decisionsBoard) {
      const decisions = await kit.listTickets(decisionsBoard.id);
      pendingDecisions = decisions.filter(d =>
        ['ready_for_review', 'client_reviewing', 'needs_discussion'].includes(d.status)
      ).length;
    }

    res.json({
      total_vendors: vendorTickets.length,
      vendors_awaiting: vendorTickets.filter(v => v.status === 'awaiting_response').length,
      vendors_booked: vendorTickets.filter(v => ['booked', 'confirmed'].includes(v.status)).length,
      pending_decisions: pendingDecisions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get decisions for an event (simplified)
app.get('/api/events/:eventId/decisions', async (req, res) => {
  try {
    // Find decisions board
    const boards = await kit.listBoards();
    const decisionsBoard = boards.find(b => b.workflow_id === 'client-decision');

    if (!decisionsBoard) {
      return res.json([]);
    }

    const decisions = await kit.listTickets(decisionsBoard.id);
    res.json(decisions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new decision
app.post('/api/events/:eventId/decisions', async (req, res) => {
  try {
    const decision = await kit.createTicket({
      board_id: req.params.eventId,
      title: req.body.title,
      description: req.body.description || '',
      status: 'drafting',
      priority: req.body.priority || 'medium',
      labels: req.body.labels || [],
    });
    res.json(decision);
  } catch (error) {
    console.error('Error creating decision:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CLIENT DECISIONS (Pain Points #2 & #3)
// ============================================================================

// Get pending client decisions
app.get('/api/events/:eventId/client-decisions', async (req, res) => {
  try {
    // Find decisions board for this event
    const boards = await kit.listBoards();
    const decisionsBoard = boards.find(b =>
      b.name.includes('Decisions') && b.name.includes(req.params.eventId)
    );

    if (!decisionsBoard) {
      return res.json({
        summary: { total_pending: 0, urgent: 0, overdue: 0 },
        decisions: [],
      });
    }

    const decisions = await kit.listTickets(decisionsBoard.id);
    const pending = decisions.filter(d =>
      ['ready_for_review', 'client_reviewing', 'needs_discussion'].includes(d.status)
    );

    const now = new Date();

    const summary = {
      total_pending: pending.length,
      urgent: pending.filter(d => {
        const deadline = new Date(d.custom_fields.deadline);
        return (deadline - now) / (1000 * 60 * 60 * 24) <= 3;
      }).length,
      overdue: pending.filter(d =>
        new Date(d.custom_fields.deadline) < now
      ).length,
    };

    const decisionsData = pending.map(d => ({
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
      blocks_count: d.custom_fields.blocks?.length || 0,
    })).sort((a, b) => a.days_remaining - b.days_remaining);

    res.json({ summary, decisions: decisionsData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single decision
app.get('/api/decisions/:decisionId', async (req, res) => {
  try {
    const decision = await kit.getTicket(req.params.decisionId);
    res.json(decision);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update decision
app.patch('/api/decisions/:decisionId', async (req, res) => {
  try {
    const decision = await kit.updateTicket(req.params.decisionId, req.body);
    res.json(decision);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete decision
app.delete('/api/decisions/:decisionId', async (req, res) => {
  try {
    await kit.deleteTicket(req.params.decisionId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment to decision
app.post('/api/decisions/:decisionId/comments', async (req, res) => {
  try {
    const { author, text } = req.body;
    const comment = await kit.addComment(req.params.decisionId, author, text);
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record client approval (with full audit trail)
app.post('/api/decisions/:decisionId/approve', async (req, res) => {
  try {
    const { selected_option, notes, client_id } = req.body;
    const decision = await kit.getTicket(req.params.decisionId);

    // 1. Move to approved status
    await kit.moveTicket(req.params.decisionId, 'approved', client_id || 'client');

    // 2. Update with decision details
    await kit.updateTicket(req.params.decisionId, {
      custom_fields: {
        ...decision.custom_fields,
        selected_option,
        decided_by: client_id || 'client',
        decided_at: new Date().toISOString(),
        decision_notes: notes,
        approval_snapshot: {
          options_presented: decision.custom_fields.options,
          prices_at_approval: decision.custom_fields.options.map(o => ({
            id: o.id,
            cost: o.cost,
          })),
          timestamp: new Date().toISOString(),
        },
      },
    }, client_id || 'client');

    // 3. Add formal comment as permanent record
    await kit.addComment(
      req.params.decisionId,
      client_id || 'client',
      `✅ **APPROVED** by ${client_id || 'client'}\n\n` +
      `**Selected:** ${selected_option}\n` +
      `**Notes:** ${notes || 'None'}\n\n` +
      `_This approval was recorded on ${new Date().toLocaleString()}_`
    );

    const updated = await kit.getTicket(req.params.decisionId);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get decision history (audit trail)
app.get('/api/decisions/:decisionId/history', async (req, res) => {
  try {
    const decision = await kit.getTicket(req.params.decisionId);
    const activity = await kit.getActivity(req.params.decisionId);
    const comments = await kit.listComments(req.params.decisionId);

    // Build timeline
    const timeline = [];

    for (const event of activity) {
      timeline.push({
        type: 'activity',
        timestamp: event.created_at,
        actor: event.user_id,
        action: event.action,
        details: event,
      });
    }

    for (const comment of comments) {
      timeline.push({
        type: 'comment',
        timestamp: comment.created_at,
        actor: comment.user_id,
        content: comment.content,
      });
    }

    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      decision,
      current_status: decision.status,
      approval: decision.custom_fields.approval_snapshot,
      timeline,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CONTACT MANAGEMENT (Pain Point #4)
// ============================================================================

// Get vendor contact info
app.get('/api/vendors/:vendorId/contact', async (req, res) => {
  try {
    const vendor = await kit.getTicket(req.params.vendorId);
    const cf = vendor.custom_fields;

    res.json({
      name: cf.vendor_name,
      contact: cf.contact_person,
      quick_contact: {
        call: cf.phone,
        email: cf.email,
        instagram: cf.instagram,
      },
      emergency: cf.emergency_phone || cf.phone,
      notes: cf.communication_notes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate day-of contact sheet
app.get('/api/events/:eventId/contact-sheet', async (req, res) => {
  try {
    const vendors = await kit.listTickets(req.params.eventId);

    // Only booked/confirmed vendors
    const active = vendors.filter(v =>
      v.custom_fields.type === 'vendor' &&
      ['booked', 'confirmed'].includes(v.status)
    );

    const sheet = {
      event_id: req.params.eventId,
      generated_at: new Date().toISOString(),
      vendors: active.map(v => ({
        category: v.custom_fields.category,
        name: v.custom_fields.vendor_name,
        contact: v.custom_fields.contact_person,
        phone: v.custom_fields.phone,
        email: v.custom_fields.email,
        emergency_phone: v.custom_fields.emergency_phone || v.custom_fields.phone,
        notes: v.custom_fields.communication_notes,
      })),
    };

    // Group by category
    sheet.by_category = {};
    for (const v of sheet.vendors) {
      if (!sheet.by_category[v.category]) {
        sheet.by_category[v.category] = [];
      }
      sheet.by_category[v.category].push(v);
    }

    res.json(sheet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TASK DEPENDENCIES (Pain Point #5)
// ============================================================================

// Check if task can be started
app.get('/api/tasks/:taskId/can-start', async (req, res) => {
  try {
    const task = await kit.getTicket(req.params.taskId);
    const blockedBy = task.custom_fields.blocked_by || [];

    if (blockedBy.length === 0) {
      return res.json({ can_start: true, blockers: [] });
    }

    const blockers = [];

    for (const blockerId of blockedBy) {
      try {
        const blocker = await kit.getTicket(blockerId);
        const resolved = ['done', 'approved', 'completed'].includes(blocker.status);

        blockers.push({
          id: blocker.id,
          title: blocker.title,
          status: blocker.status,
          resolved,
        });
      } catch (err) {
        blockers.push({ id: blockerId, status: 'not_found', resolved: false });
      }
    }

    res.json({
      can_start: blockers.every(b => b.resolved),
      blockers,
      unresolved_count: blockers.filter(b => !b.resolved).length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tasks ready to start
app.get('/api/events/:eventId/tasks/ready', async (req, res) => {
  try {
    const tasks = await kit.listTickets(req.params.eventId);
    const ready = [];

    for (const task of tasks) {
      // Skip completed
      if (['done', 'approved', 'completed'].includes(task.status)) continue;

      const blockedBy = task.custom_fields.blocked_by || [];

      // If no blockers, it's ready
      if (blockedBy.length === 0) {
        ready.push({
          ...task,
          blocks_count: task.custom_fields.blocks?.length || 0,
        });
        continue;
      }

      // Check if all blockers are resolved
      let allResolved = true;
      for (const blockerId of blockedBy) {
        try {
          const blocker = await kit.getTicket(blockerId);
          if (!['done', 'approved', 'completed'].includes(blocker.status)) {
            allResolved = false;
            break;
          }
        } catch (err) {
          allResolved = false;
          break;
        }
      }

      if (allResolved) {
        ready.push({
          ...task,
          blocks_count: task.custom_fields.blocks?.length || 0,
        });
      }
    }

    // Sort by priority, then by blocks_count
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    ready.sort((a, b) => {
      const pDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      if (pDiff !== 0) return pDiff;
      return b.blocks_count - a.blocks_count;
    });

    res.json({ count: ready.length, tasks: ready });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// MULTI-EVENT DASHBOARD (Pain Point #6)
// ============================================================================

app.get('/api/dashboard/today', async (req, res) => {
  try {
    const allEvents = await kit.listBoards();
    const alerts = [];

    for (const event of allEvents) {
      const vendors = await kit.listTickets(event.id);

      // Check for stale vendors
      const now = new Date();
      for (const vendor of vendors) {
        if (vendor.custom_fields.type !== 'vendor') continue;
        if (vendor.status !== 'awaiting_response') continue;

        const lastContact = new Date(vendor.custom_fields.last_contacted);
        const daysSince = (now - lastContact) / (1000 * 60 * 60 * 24);

        if (daysSince >= 5) {
          alerts.push({
            event_name: event.name,
            event_id: event.id,
            type: 'stale_vendor',
            vendor: vendor.title,
            days_waiting: Math.floor(daysSince),
          });
        }
      }
    }

    res.json({
      total_events: allEvents.length,
      alerts_today: alerts.length,
      alerts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 3002;

setup().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🎉 Wedding Planner API running on http://localhost:${PORT}`);
    console.log('\n📋 Try these endpoints:');
    console.log(`   GET  http://localhost:${PORT}/api/events`);
    console.log(`   GET  http://localhost:${PORT}/api/dashboard/today`);
    console.log(`   GET  http://localhost:${PORT}/api/events/[eventId]/vendor-dashboard`);
    console.log(`   GET  http://localhost:${PORT}/api/events/[eventId]/vendors/stale`);
    console.log(`   GET  http://localhost:${PORT}/api/events/[eventId]/client-decisions`);
    console.log('');
  });
});
