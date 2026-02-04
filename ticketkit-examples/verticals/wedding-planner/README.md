# Wedding Planner - Vertical SaaS Example

> A production-ready wedding/event planner API built with TicketKit, solving the top 5 pain points for professional planners.

## What This Solves

Wedding planners manage **15+ active events** simultaneously, each with **20+ vendors**, **dozens of client decisions**, and **300+ interdependent tasks**. Existing tools fail because they're either too generic (project management apps) or too rigid (wedding-specific software).

This example shows how TicketKit can build a **vertical SaaS product** that solves real business problems.

---

## The 5 Pain Points Solved

### 1. Vendor Follow-Up Black Hole 👻

**Problem:** No single view of which vendors are ghosting you this week.

**Solution:**
- Custom `vendor-management` workflow (10 states)
- "Stale vendors" query finds non-responsive vendors
- Dashboard shows: ghosting (7+ days), follow-ups due, deposits due

**API Endpoints:**
- `GET /api/events/:eventId/vendors/stale` - Who's ghosting you
- `GET /api/events/:eventId/vendor-dashboard` - Complete vendor overview

---

### 2. Client Decision Invisibility 📋

**Problem:** Can't easily show clients the 7 decisions blocking progress.

**Solution:**
- Separate `client-decision` workflow
- Client-friendly decision queue with deadlines
- Shows what's urgent, overdue, and blocking other tasks

**API Endpoints:**
- `GET /api/events/:eventId/client-decisions` - Pending decisions sorted by urgency

---

### 3. Client Approval Amnesia 🔍

**Problem:** "You never told me that!" - No audit trail of approvals.

**Solution:**
- Full activity log + comments + approval snapshots
- Every approval records: what options they saw, when they decided, what they chose
- Immutable audit trail prevents disputes

**API Endpoints:**
- `POST /api/decisions/:id/approve` - Record approval with full context
- `GET /api/decisions/:id/history` - Complete audit trail

---

### 4. Contact Info Scattered Everywhere 📞

**Problem:** Vendor details across emails, texts, spreadsheets, Instagram DMs.

**Solution:**
- Structured vendor contact fields on every vendor ticket
- Generate day-of contact sheet for all confirmed vendors
- Quick lookup by vendor ID

**API Endpoints:**
- `GET /api/vendors/:id/contact` - Quick contact lookup
- `GET /api/events/:eventId/contact-sheet` - Day-of emergency contact list

---

### 5. Task Dependencies (Can't Start X Until Y Done) 🔗

**Problem:** 300+ tasks but no way to show dependencies.

**Solution:**
- `blocked_by` and `blocks` fields on every task
- "Ready to start" view shows only unblocked tasks
- Sorted by priority and impact

**API Endpoints:**
- `GET /api/tasks/:id/can-start` - Check if task is unblocked
- `GET /api/events/:eventId/tasks/ready` - All tasks ready to start now

---

## Quick Start

### Backend API

```bash
cd ticketkit-examples/verticals/wedding-planner/server
npm install
npm start
```

Server runs at **http://localhost:3002** with sample data.

### React UI

```bash
cd ticketkit-examples/verticals/wedding-planner/client
npm install
npm run dev
```

UI runs at **http://localhost:5173** (proxies to API on port 3002)

---

## ⚠️ Demo Limitations

**This is a demonstration application with the following limitations:**

1. **In-Memory Database**: All data is stored in memory and lost on server restart. For production, configure persistent SQLite or use PostgreSQL/MySQL.

2. **Unrestricted Workflows**: All workflow state transitions are currently allowed (any status → any status) for demo flexibility. In production, you should configure proper transition rules in `server/workflows.js`.

3. **No Authentication**: No user authentication or authorization. Add proper auth middleware for production.

4. **Minimal Validation**: Basic input validation only. Add comprehensive validation for production use.

5. **No Error UI**: Failed operations log to console but don't show user-friendly messages. Add error toasts/alerts for production.

**To use in production:** Add authentication, persistent storage, input validation, error handling, and configure proper workflow transitions.

---

## API Reference

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List all events |
| POST | `/api/events` | Create new event |
| GET | `/api/dashboard/today` | Cross-event alerts |

### Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events/:eventId/vendors` | List all vendors for event |
| POST | `/api/events/:eventId/vendors` | Add vendor to event |
| GET | `/api/events/:eventId/vendors/stale` | Find non-responsive vendors |
| GET | `/api/events/:eventId/vendor-dashboard` | Complete vendor overview |
| GET | `/api/vendors/:vendorId/contact` | Get contact info |
| GET | `/api/events/:eventId/contact-sheet` | Day-of contact sheet |

### Client Decisions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events/:eventId/client-decisions` | Pending decisions queue |
| POST | `/api/decisions/:id/approve` | Record client approval |
| GET | `/api/decisions/:id/history` | Full audit trail |

### Tasks & Dependencies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/:taskId/can-start` | Check if task can start |
| GET | `/api/events/:eventId/tasks/ready` | Tasks ready to work on |

---

## Example Requests

### Check for Ghosting Vendors

```bash
curl http://localhost:3002/api/events/evt_123/vendors/stale?days=7
```

**Response:**
```json
{
  "threshold_days": 7,
  "stale_count": 2,
  "vendors": [
    {
      "id": "tkt_456",
      "title": "Florist - Bloom & Wild",
      "days_waiting": 8,
      "suggested_action": "follow_up",
      "custom_fields": {
        "vendor_name": "Bloom & Wild Florals",
        "contact_person": "Maria Santos",
        "email": "maria@bloomwild.com",
        "phone": "555-0123"
      }
    }
  ]
}
```

### Get Client Decision Queue

```bash
curl http://localhost:3002/api/events/evt_123/client-decisions
```

**Response:**
```json
{
  "summary": {
    "total_pending": 3,
    "urgent": 1,
    "overdue": 0
  },
  "decisions": [
    {
      "id": "dec_789",
      "title": "Centerpiece Style Selection",
      "category": "florals",
      "description": "Choose between 3 centerpiece styles",
      "options": [
        { "id": "tall", "name": "Tall dramatic", "cost": 150 },
        { "id": "low", "name": "Low lush", "cost": 120 }
      ],
      "deadline": "2024-02-20",
      "days_remaining": 5,
      "status": "client_reviewing",
      "blocks_count": 1
    }
  ]
}
```

### Record Client Approval

```bash
curl -X POST http://localhost:3002/api/decisions/dec_789/approve \
  -H "Content-Type: application/json" \
  -d '{
    "selected_option": "low",
    "notes": "We prefer the low lush style to keep conversation easier",
    "client_id": "bride@example.com"
  }'
```

**This creates:**
- Activity log entry (status change to "approved")
- Comment with approval details
- Approval snapshot (what they saw, when they decided, prices at time of approval)

---

## Data Models

### Vendor Ticket

```javascript
{
  title: "Florist - Bloom & Wild",
  status: "awaiting_response",  // vendor-management workflow
  priority: "high",
  labels: ["florist", "flowers", "decor"],
  custom_fields: {
    type: "vendor",

    // Contact
    vendor_name: "Bloom & Wild Florals",
    contact_person: "Maria Santos",
    email: "maria@bloomwild.com",
    phone: "555-0123",
    instagram: "@bloomwildflorals",
    emergency_phone: "555-0199",

    // Category
    category: "florist",  // florist, photographer, caterer, venue, etc.

    // Tracking
    last_contacted: "2024-02-10T10:00:00Z",
    last_response: "2024-02-08T14:30:00Z",
    next_followup: "2024-02-15T09:00:00Z",

    // Financials
    quote_amount: 4500,
    deposit_amount: 1500,
    deposit_due: "2024-03-01",
    deposit_paid: false,
    balance_due: "2024-06-01",
    balance_paid: false,

    // Notes
    communication_notes: "Prefers text for quick questions"
  }
}
```

### Decision Ticket

```javascript
{
  title: "Centerpiece Style Selection",
  status: "client_reviewing",  // client-decision workflow
  priority: "high",
  labels: ["florals", "decor"],
  custom_fields: {
    type: "decision",

    // Details
    category: "florals",
    description: "Choose between 3 centerpiece styles for reception tables",

    // Options
    options: [
      { id: "tall", name: "Tall dramatic", cost: 150 },
      { id: "low", name: "Low lush", cost: 120 },
      { id: "mixed", name: "Mixed heights", cost: 135 }
    ],

    // Tracking
    sent_to_client: "2024-02-10",
    deadline: "2024-02-20",

    // Dependencies
    blocks: ["florist-final-order", "rental-table-selection"],
    blocked_by: ["venue-table-count-confirmed"],

    // Decision record (filled when approved)
    selected_option: null,
    decided_by: null,
    decided_at: null,
    decision_notes: null,

    // Approval snapshot (immutable audit trail)
    approval_snapshot: {
      options_presented: [...],
      prices_at_approval: [...],
      timestamp: "2024-02-15T16:45:00Z"
    }
  }
}
```

---

## Custom Workflows

### Vendor Management Workflow

```
researching → contacted → awaiting_response → proposal_received
     ↓                                              ↓
  declined ←──────────────────────────┬─────→ client_review
                                      │            ↓
                                      │       negotiating
                                      │            ↓
                                      └────────→ booked → confirmed → completed
```

**States:**
- `researching` - Gathering vendor options
- `contacted` - Initial outreach sent
- `awaiting_response` - Waiting for vendor reply
- `proposal_received` - Quote/proposal received
- `client_review` - Client deciding
- `negotiating` - Back and forth on terms
- `booked` - Contract signed, deposit paid
- `confirmed` - Re-confirmed closer to event
- `completed` - Event done, final payment made
- `declined` - Didn't work out

### Client Decision Workflow

```
drafting → ready_for_review → client_reviewing → approved
                ↓                     ↓
        needs_discussion        needs_discussion
```

**States:**
- `drafting` - Planner preparing options
- `ready_for_review` - Sent to client
- `client_reviewing` - Client thinking
- `needs_discussion` - Client has questions
- `approved` - Client decided
- `declined` - Client rejected all options

---

## Multi-Event Dashboard

```bash
curl http://localhost:3002/api/dashboard/today
```

**Shows across ALL events:**
- Total active events
- Vendors ghosting you (any event)
- Decisions overdue (any event)
- Follow-ups due today

**Perfect for:** Morning review of "what needs attention NOW"

---

## Extending This Example

### Add Budget Tracking

```javascript
app.get('/api/events/:eventId/budget', async (req, res) => {
  const vendors = await kit.listTickets(req.params.eventId);

  const budget = vendors.reduce((sum, v) => {
    return sum + (v.custom_fields.quote_amount || 0);
  }, 0);

  const paid = vendors.reduce((sum, v) => {
    return sum + (v.custom_fields.deposit_paid ? v.custom_fields.deposit_amount : 0);
  }, 0);

  res.json({ total_budget: budget, paid, remaining: budget - paid });
});
```

### Add Timeline Changes Notification

```javascript
app.post('/api/events/:eventId/timeline-change', async (req, res) => {
  const { change_description } = req.body;
  const vendors = await kit.listTickets(req.params.eventId);

  // Find all booked vendors
  const booked = vendors.filter(v =>
    ['booked', 'confirmed'].includes(v.status)
  );

  // Add comment to each vendor ticket
  for (const vendor of booked) {
    await kit.addComment(
      vendor.id,
      'planner',
      `⚠️ Timeline Change: ${change_description}`
    );

    // In production: send email/SMS here
    console.log(`Notified ${vendor.custom_fields.vendor_name}`);
  }

  res.json({ notified: booked.length });
});
```

### Add Recurring Follow-Ups

```javascript
app.post('/api/vendors/:vendorId/schedule-followup', async (req, res) => {
  const { days } = req.body;  // e.g., 7 for weekly

  const vendor = await kit.getTicket(req.params.vendorId);
  const nextFollowup = new Date();
  nextFollowup.setDate(nextFollowup.getDate() + days);

  await kit.updateTicket(req.params.vendorId, {
    custom_fields: {
      ...vendor.custom_fields,
      next_followup: nextFollowup.toISOString(),
      followup_frequency_days: days,
    },
  });

  res.json({ next_followup: nextFollowup });
});
```

---

## React UI

A complete React dashboard is included in the `client/` directory, demonstrating all 5 pain points:

### Features

1. **Event Switcher** - Multi-event dropdown in header
2. **Stats Overview** - Total vendors, awaiting response, booked, pending decisions
3. **Vendor Pipeline** - All vendors with status badges and contact info
4. **Ghosting Alerts** - Warning banner for vendors not responding 3+ days
5. **Client Decisions Queue** - Pending decisions with priority badges
6. **Contact Information** - Email and phone displayed on vendor cards
7. **Professional Design** - Clean, minimal UI without excessive decoration

### UI Stack

- React 18 with Hooks
- Vite for fast development
- Clean CSS (no framework dependencies)
- Responsive design for mobile/desktop

### Screenshots

The UI shows:
- **Dashboard view** with real-time stats across all vendors and decisions
- **Vendor cards** with status colors, ghosting badges, and contact details
- **Decision cards** with priority levels (urgent, high, medium, low)
- **Days ago** tracking for all items
- **Event selector** for multi-event management

---

## Why This Example Matters

### For TicketKit

1. **Proves vertical SaaS viability** - Shows TicketKit can build real products
2. **Demonstrates advanced features** - Custom workflows, dependencies, audit trails
3. **Real business value** - Solves painful problems people pay to fix
4. **Complete example** - Full-stack (API + React UI) wedding planner
5. **Marketing gold** - "Build a wedding planner in 500 lines + professional UI"

### For Wedding Planners

1. **Fills market gap** - Existing tools are either too generic or too rigid
2. **Professional tool** - Built for planners managing 15+ events
3. **Audit trail** - Prevents client disputes
4. **Multi-event view** - See what needs attention across all events

---

## Related Examples

- **[03-react-kanban](../../03-react-kanban)** - Generic kanban board (good for UI patterns)
- **[verticals/vet-clinic](../vet-clinic)** - Patient flow tracking (simpler vertical example)
- **[02-rest-api](../../02-rest-api)** - REST API basics

---

## Production Deployment

To deploy this:

1. **Add authentication** (JWT, Auth0, Clerk)
2. **Switch to file storage** (`storage: 'file'` in TicketKit)
3. **Add multi-tenancy** (board per tenant, isolate data)
4. **Add notifications** (email/SMS via Twilio, SendGrid)
5. **Add billing** (Stripe for subscriptions)
6. **Build frontend** (React, Next.js, or mobile app)

---

## License

MIT - Use this example however you like.

Built with [TicketKit](https://github.com/Kiara-02-Lab-OW/ticket.api)
