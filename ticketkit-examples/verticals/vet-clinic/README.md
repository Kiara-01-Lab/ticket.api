# Vet Clinic Patient Flow

> A patient tracking system for veterinary clinics built with ticket.api.

![Workflow](./workflow.png)

## What This Demonstrates

- **Custom workflow** tailored for veterinary clinics
- **Custom fields** for patient/pet data
- **Real-world vertical** application
- How to extend ticket.api for industry-specific needs

## The Workflow

```
                    ┌─────────────┐
                    │   Waiting   │
                    │   Room      │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Exam Room  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │Treatment │ │Lab Pending│ │ Checkout │
        └────┬─────┘ └─────┬────┘ └────┬─────┘
             │             │           │
             └──────┬──────┘           │
                    │                  │
                    ▼                  │
              ┌──────────┐             │
              │ Checkout │◄────────────┘
              └────┬─────┘
                   │
                   ▼
              ┌──────────┐
              │Discharged│
              └──────────┘
```

## Quick Start

```bash
npm install
npm start
```

Server runs at http://localhost:3000 with sample data.

## API Endpoints

### Patient Board

```bash
# Get today's patient board (Kanban view)
curl http://localhost:3000/api/today
```

Response:
```json
{
  "board": { "id": "...", "name": "2024-02-15" },
  "workflow": { "id": "vet-clinic", "states": [...] },
  "columns": {
    "waiting": [...],
    "exam_room": [...],
    "treatment": [...],
    "lab_pending": [...],
    "checkout": [...],
    "discharged": [...]
  }
}
```

### Check In a Patient

```bash
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "pet_name": "Bella",
    "species": "dog",
    "breed": "Beagle",
    "owner_name": "John Smith",
    "owner_phone": "555-1234",
    "reason": "Limping on front left paw",
    "doctor": "Dr. Garcia",
    "priority": "high"
  }'
```

### Move Patient Through Workflow

```bash
# Call patient to exam room
curl -X POST http://localhost:3000/api/patients/PATIENT_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "exam_room",
    "exam_room": "Room 3",
    "notes": "Owner reports limping started yesterday"
  }'

# Send to treatment
curl -X POST http://localhost:3000/api/patients/PATIENT_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "treatment",
    "notes": "X-ray shows minor sprain, prescribing rest and pain meds"
  }'

# Ready for checkout
curl -X POST http://localhost:3000/api/patients/PATIENT_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "checkout"}'

# Discharged
curl -X POST http://localhost:3000/api/patients/PATIENT_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "discharged"}'
```

### Record Vitals

```bash
curl -X POST http://localhost:3000/api/patients/PATIENT_ID/vitals \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": "101.2°F",
    "heart_rate": "90 bpm",
    "weight": "28 lbs"
  }'
```

### Add Notes

```bash
curl -X POST http://localhost:3000/api/patients/PATIENT_ID/notes \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Owner approved treatment plan",
    "author": "Tech Sarah"
  }'
```

### Dashboard Stats

```bash
curl http://localhost:3000/api/stats
```

Response:
```json
{
  "total": 8,
  "waiting": 2,
  "in_exam": 3,
  "in_treatment": 2,
  "checkout": 1,
  "discharged": 0
}
```

## Data Model

### Patient (Ticket)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID |
| `title` | string | "Pet Name (Species)" |
| `status` | string | Current workflow state |
| `priority` | string | low, medium, high, urgent |
| `labels` | string[] | Species, tags |
| `custom_fields.pet_name` | string | Pet's name |
| `custom_fields.species` | string | dog, cat, bird, etc. |
| `custom_fields.breed` | string | Breed |
| `custom_fields.owner_name` | string | Owner's name |
| `custom_fields.owner_phone` | string | Contact number |
| `custom_fields.reason` | string | Reason for visit |
| `custom_fields.doctor` | string | Assigned vet |
| `custom_fields.exam_room` | string | Room number |
| `custom_fields.vitals` | object | Temperature, heart rate, weight |
| `custom_fields.notes` | array | Timestamped notes |
| `custom_fields.check_in_time` | string | ISO timestamp |

## Customization

### Add More Species

```javascript
const SPECIES = ['dog', 'cat', 'bird', 'reptile', 'rabbit', 'hamster', 'fish', 'other'];

// Validate on check-in
if (!SPECIES.includes(species)) {
  return res.status(400).json({ error: 'Invalid species' });
}
```

### Add Appointment Types

```javascript
const APPOINTMENT_TYPES = {
  checkup: { priority: 'low', estimated_time: 30 },
  vaccination: { priority: 'low', estimated_time: 15 },
  sick_visit: { priority: 'medium', estimated_time: 45 },
  surgery: { priority: 'high', estimated_time: 120 },
  emergency: { priority: 'urgent', estimated_time: 60 },
};
```

### Add Billing Integration

```javascript
app.post('/api/patients/:id/checkout', async (req, res) => {
  const patient = await kit.getTicket(req.params.id);
  
  // Calculate charges based on services
  const charges = calculateCharges(patient.custom_fields.services);
  
  // Generate invoice
  const invoice = await billingSystem.createInvoice({
    patient_id: req.params.id,
    owner: patient.custom_fields.owner_name,
    charges,
  });
  
  // Move to discharged
  await kit.moveTicket(req.params.id, 'discharged');
  
  res.json({ patient, invoice });
});
```

## Building a UI

The API is designed to work with any frontend. Here's a React example:

```jsx
function PatientBoard() {
  const [kanban, setKanban] = useState(null);
  
  useEffect(() => {
    fetch('/api/today')
      .then(res => res.json())
      .then(setKanban);
  }, []);
  
  if (!kanban) return <div>Loading...</div>;
  
  return (
    <div className="board">
      {Object.entries(kanban.columns).map(([status, patients]) => (
        <Column 
          key={status} 
          status={status} 
          patients={patients}
          onMove={(patientId, newStatus) => {
            fetch(`/api/patients/${patientId}/status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: newStatus }),
            }).then(() => refreshBoard());
          }}
        />
      ))}
    </div>
  );
}
```

## Other Vertical Ideas

This same pattern can be applied to:

- **Dental Lab** — Case tracking from impression to delivery
- **Auto Body Shop** — Repair stages from estimate to pickup
- **Salon/Spa** — Client flow from check-in to checkout
- **Restaurant Kitchen** — Order tracking from ticket to served
- **Property Management** — Maintenance request workflow

See the [verticals](../) directory for more examples.
