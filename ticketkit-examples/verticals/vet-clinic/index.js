/**
 * ticket.api - Veterinary Clinic Patient Flow
 * 
 * A patient tracking system for veterinary clinics.
 * Tracks patients from check-in to discharge.
 * 
 * Workflow:
 *   waiting → exam_room → [treatment|lab_pending] → checkout → discharged
 * 
 * Usage:
 *   node index.js
 */

const express = require('express');
const cors = require('cors');
const { TicketKit } = require('ticketkit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let kit;

// ── Custom Workflow ─────────────────────────────────────────────────────────

const VET_WORKFLOW = {
  id: 'vet-clinic',
  name: 'Patient Flow',
  states: [
    'waiting',      // Patient checked in, in waiting room
    'exam_room',    // In exam room with vet
    'treatment',    // Receiving treatment
    'lab_pending',  // Waiting for lab results
    'checkout',     // Ready for checkout
    'discharged',   // Gone home
  ],
  transitions: {
    waiting: ['exam_room'],
    exam_room: ['treatment', 'lab_pending', 'checkout'],
    treatment: ['lab_pending', 'checkout', 'exam_room'],
    lab_pending: ['exam_room', 'treatment', 'checkout'],
    checkout: ['discharged'],
    discharged: [], // Terminal state
  },
};

// ── Patient (Ticket) Schema ─────────────────────────────────────────────────

/**
 * Patient custom fields:
 * {
 *   pet_name: string,
 *   species: 'dog' | 'cat' | 'bird' | 'reptile' | 'other',
 *   breed: string,
 *   weight: string,
 *   owner_name: string,
 *   owner_phone: string,
 *   reason: string,
 *   doctor: string,
 *   exam_room: string,
 *   notes: string[],
 *   vitals: {
 *     temperature: string,
 *     heart_rate: string,
 *     weight: string,
 *   }
 * }
 */

// ── API Routes ──────────────────────────────────────────────────────────────

// Get today's board
app.get('/api/today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  let board = (await kit.listBoards()).find(b => b.name === today);
  
  if (!board) {
    board = await kit.createBoard({
      name: today,
      description: `Patients for ${today}`,
      workflow_id: 'vet-clinic',
    });
  }
  
  const view = await kit.getKanbanView(board.id);
  res.json(view);
});

// Check in a patient
app.post('/api/patients', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  let board = (await kit.listBoards()).find(b => b.name === today);
  
  if (!board) {
    board = await kit.createBoard({
      name: today,
      workflow_id: 'vet-clinic',
    });
  }
  
  const { pet_name, species, breed, owner_name, owner_phone, reason, doctor } = req.body;
  
  const patient = await kit.createTicket({
    board_id: board.id,
    title: `${pet_name} (${species})`,
    priority: req.body.priority || 'medium',
    labels: [species],
    custom_fields: {
      pet_name,
      species,
      breed,
      owner_name,
      owner_phone,
      reason,
      doctor,
      check_in_time: new Date().toISOString(),
      notes: [],
    },
  });
  
  res.status(201).json(patient);
});

// Get patient details
app.get('/api/patients/:id', async (req, res) => {
  const patient = await kit.getTicket(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  res.json(patient);
});

// Update patient status (move through workflow)
app.post('/api/patients/:id/status', async (req, res) => {
  const { status, exam_room, notes } = req.body;
  
  // Move to new status
  await kit.moveTicket(req.params.id, status);
  
  // Update custom fields if provided
  const updates = {};
  if (exam_room) {
    updates.custom_fields = { exam_room };
  }
  if (notes) {
    const patient = await kit.getTicket(req.params.id);
    updates.custom_fields = {
      ...patient.custom_fields,
      notes: [...(patient.custom_fields.notes || []), {
        text: notes,
        time: new Date().toISOString(),
        author: req.body.author || 'staff',
      }],
    };
  }
  
  if (Object.keys(updates).length > 0) {
    await kit.updateTicket(req.params.id, updates);
  }
  
  const patient = await kit.getTicket(req.params.id);
  res.json(patient);
});

// Add vitals
app.post('/api/patients/:id/vitals', async (req, res) => {
  const patient = await kit.getTicket(req.params.id);
  
  await kit.updateTicket(req.params.id, {
    custom_fields: {
      ...patient.custom_fields,
      vitals: req.body,
    },
  });
  
  const updated = await kit.getTicket(req.params.id);
  res.json(updated);
});

// Add note
app.post('/api/patients/:id/notes', async (req, res) => {
  const patient = await kit.getTicket(req.params.id);
  
  const note = {
    text: req.body.text,
    time: new Date().toISOString(),
    author: req.body.author || 'staff',
  };
  
  await kit.updateTicket(req.params.id, {
    custom_fields: {
      ...patient.custom_fields,
      notes: [...(patient.custom_fields.notes || []), note],
    },
  });
  
  const updated = await kit.getTicket(req.params.id);
  res.json(updated);
});

// Get workflow states
app.get('/api/workflow', async (req, res) => {
  const workflow = await kit.getWorkflow('vet-clinic');
  res.json(workflow);
});

// ── Dashboard Stats ─────────────────────────────────────────────────────────

app.get('/api/stats', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const board = (await kit.listBoards()).find(b => b.name === today);
  
  if (!board) {
    return res.json({
      total: 0,
      waiting: 0,
      in_treatment: 0,
      discharged: 0,
    });
  }
  
  const { columns } = await kit.getKanbanView(board.id);
  
  res.json({
    total: Object.values(columns).flat().length,
    waiting: columns.waiting?.length || 0,
    in_exam: columns.exam_room?.length || 0,
    in_treatment: (columns.treatment?.length || 0) + (columns.lab_pending?.length || 0),
    checkout: columns.checkout?.length || 0,
    discharged: columns.discharged?.length || 0,
  });
});

// ── Seed Data ───────────────────────────────────────────────────────────────

async function seedData() {
  // Register custom workflow
  try {
    await kit.createWorkflow(VET_WORKFLOW);
    console.log('✓ Created vet-clinic workflow');
  } catch (err) {
    // Workflow might already exist
  }
  
  // Create today's board with sample patients
  const today = new Date().toISOString().split('T')[0];
  let board = (await kit.listBoards()).find(b => b.name === today);
  
  if (!board) {
    board = await kit.createBoard({
      name: today,
      description: `Patients for ${today}`,
      workflow_id: 'vet-clinic',
    });
    
    console.log(`✓ Created board for ${today}`);
    
    // Add sample patients
    const patients = [
      {
        title: 'Max (Dog)',
        priority: 'medium',
        labels: ['dog'],
        custom_fields: {
          pet_name: 'Max',
          species: 'dog',
          breed: 'Golden Retriever',
          owner_name: 'Sarah Johnson',
          owner_phone: '555-0101',
          reason: 'Annual checkup + vaccines',
          doctor: 'Dr. Smith',
          check_in_time: new Date(Date.now() - 45 * 60000).toISOString(),
          notes: [],
        },
      },
      {
        title: 'Whiskers (Cat)',
        priority: 'high',
        labels: ['cat'],
        custom_fields: {
          pet_name: 'Whiskers',
          species: 'cat',
          breed: 'Persian',
          owner_name: 'Mike Chen',
          owner_phone: '555-0102',
          reason: 'Vomiting, not eating',
          doctor: 'Dr. Garcia',
          check_in_time: new Date(Date.now() - 30 * 60000).toISOString(),
          notes: [],
        },
      },
      {
        title: 'Buddy (Dog)',
        priority: 'urgent',
        labels: ['dog', 'emergency'],
        custom_fields: {
          pet_name: 'Buddy',
          species: 'dog',
          breed: 'Labrador',
          owner_name: 'Emily Davis',
          owner_phone: '555-0103',
          reason: 'Hit by car - possible fracture',
          doctor: 'Dr. Smith',
          exam_room: 'ER-1',
          check_in_time: new Date(Date.now() - 15 * 60000).toISOString(),
          notes: [{
            text: 'X-ray ordered for right hind leg',
            time: new Date(Date.now() - 10 * 60000).toISOString(),
            author: 'Dr. Smith',
          }],
          vitals: {
            temperature: '101.5°F',
            heart_rate: '120 bpm',
            weight: '65 lbs',
          },
        },
      },
      {
        title: 'Luna (Cat)',
        priority: 'low',
        labels: ['cat'],
        custom_fields: {
          pet_name: 'Luna',
          species: 'cat',
          breed: 'Siamese',
          owner_name: 'Tom Wilson',
          owner_phone: '555-0104',
          reason: 'Nail trim',
          doctor: 'Tech Jessica',
          check_in_time: new Date(Date.now() - 60 * 60000).toISOString(),
          notes: [],
        },
      },
    ];
    
    for (const data of patients) {
      await kit.createTicket({ board_id: board.id, ...data });
    }
    
    // Move patients to different states
    const all = await kit.listTickets({ board_id: board.id });
    
    // Max - in exam room
    await kit.moveTicket(all[0].id, 'exam_room');
    await kit.updateTicket(all[0].id, {
      custom_fields: { ...all[0].custom_fields, exam_room: 'Room 2' },
    });
    
    // Whiskers - still waiting
    // (stays in waiting)
    
    // Buddy - in treatment (emergency)
    await kit.moveTicket(all[2].id, 'exam_room');
    await kit.moveTicket(all[2].id, 'treatment');
    
    // Luna - ready for checkout
    await kit.moveTicket(all[3].id, 'exam_room');
    await kit.moveTicket(all[3].id, 'checkout');
    
    console.log(`✓ Created ${patients.length} sample patients`);
  }
}

// ── Start ───────────────────────────────────────────────────────────────────

async function start() {
  kit = await TicketKit.create({ dbPath: './vet-clinic.db' });
  
  await seedData();
  
  app.listen(PORT, () => {
    console.log(`
🐾 Vet Clinic Patient Flow System
─────────────────────────────────────────
Server running at http://localhost:${PORT}

Endpoints:
  GET  /api/today              Today's patient board
  POST /api/patients           Check in a patient
  GET  /api/patients/:id       Get patient details
  POST /api/patients/:id/status  Update patient status
  POST /api/patients/:id/vitals  Record vitals
  POST /api/patients/:id/notes   Add a note
  GET  /api/stats              Dashboard statistics
  GET  /api/workflow           Get workflow definition

Try it:
  curl http://localhost:${PORT}/api/today
  curl http://localhost:${PORT}/api/stats
`);
  });
}

start().catch(console.error);
