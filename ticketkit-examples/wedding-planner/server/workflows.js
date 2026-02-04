/**
 * Custom workflows for wedding planner vertical
 */

const VENDOR_WORKFLOW = {
  id: 'vendor-management',
  name: 'Vendor Pipeline',
  initial_state: 'researching',
  states: [
    'researching',         // Gathering options
    'contacted',           // Initial outreach sent
    'awaiting_response',   // Ball in their court
    'proposal_received',   // They responded with quote
    'client_review',       // Waiting on client decision
    'negotiating',         // Back and forth on terms
    'booked',              // Contract signed, deposit paid
    'confirmed',           // Re-confirmed closer to date
    'completed',           // Event done, final payment made
    'declined',            // Didn't work out
  ],
  transitions: {
    researching: ['researching', 'contacted', 'awaiting_response', 'proposal_received', 'client_review', 'negotiating', 'booked', 'confirmed', 'completed', 'declined'],
    contacted: ['researching', 'contacted', 'awaiting_response', 'proposal_received', 'client_review', 'negotiating', 'booked', 'confirmed', 'completed', 'declined'],
    awaiting_response: ['researching', 'contacted', 'awaiting_response', 'proposal_received', 'client_review', 'negotiating', 'booked', 'confirmed', 'completed', 'declined'],
    proposal_received: ['researching', 'contacted', 'awaiting_response', 'proposal_received', 'client_review', 'negotiating', 'booked', 'confirmed', 'completed', 'declined'],
    client_review: ['researching', 'contacted', 'awaiting_response', 'proposal_received', 'client_review', 'negotiating', 'booked', 'confirmed', 'completed', 'declined'],
    negotiating: ['researching', 'contacted', 'awaiting_response', 'proposal_received', 'client_review', 'negotiating', 'booked', 'confirmed', 'completed', 'declined'],
    booked: ['researching', 'contacted', 'awaiting_response', 'proposal_received', 'client_review', 'negotiating', 'booked', 'confirmed', 'completed', 'declined'],
    confirmed: ['researching', 'contacted', 'awaiting_response', 'proposal_received', 'client_review', 'negotiating', 'booked', 'confirmed', 'completed', 'declined'],
    completed: ['researching', 'contacted', 'awaiting_response', 'proposal_received', 'client_review', 'negotiating', 'booked', 'confirmed', 'completed', 'declined'],
    declined: ['researching', 'contacted', 'awaiting_response', 'proposal_received', 'client_review', 'negotiating', 'booked', 'confirmed', 'completed', 'declined'],
  },
};

const DECISION_WORKFLOW = {
  id: 'client-decision',
  name: 'Client Decision',
  initial_state: 'drafting',
  states: [
    'drafting',            // Planner preparing options
    'ready_for_review',    // Sent to client
    'client_reviewing',    // Client acknowledged, thinking
    'needs_discussion',    // Client has questions
    'approved',            // Client decided
    'declined',            // Client said no to all options
  ],
  transitions: {
    drafting: ['drafting', 'ready_for_review', 'client_reviewing', 'needs_discussion', 'approved', 'declined'],
    ready_for_review: ['drafting', 'ready_for_review', 'client_reviewing', 'needs_discussion', 'approved', 'declined'],
    client_reviewing: ['drafting', 'ready_for_review', 'client_reviewing', 'needs_discussion', 'approved', 'declined'],
    needs_discussion: ['drafting', 'ready_for_review', 'client_reviewing', 'needs_discussion', 'approved', 'declined'],
    approved: ['drafting', 'ready_for_review', 'client_reviewing', 'needs_discussion', 'approved', 'declined'],
    declined: ['drafting', 'ready_for_review', 'client_reviewing', 'needs_discussion', 'approved', 'declined'],
  },
};

module.exports = {
  VENDOR_WORKFLOW,
  DECISION_WORKFLOW,
};
