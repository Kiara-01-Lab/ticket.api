import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendor, setNewVendor] = useState({ title: '', description: '', category: 'vendor', contact_person: '', email: '', phone: '' });
  const [showAddDecision, setShowAddDecision] = useState(false);
  const [newDecision, setNewDecision] = useState({ title: '', description: '', priority: 'medium' });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchVendors();
      fetchDecisions();
      fetchStats();
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data);
      if (data.length > 0) {
        setSelectedEvent(data[0].id);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch(`/api/events/${selectedEvent}/vendors`);
      const data = await res.json();
      setVendors(data);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    }
  };

  const fetchDecisions = async () => {
    try {
      const res = await fetch(`/api/events/${selectedEvent}/decisions`);
      const data = await res.json();
      setDecisions(data);
    } catch (err) {
      console.error('Failed to fetch decisions:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/events/${selectedEvent}/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    try {
      await fetch(`/api/events/${selectedEvent}/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newVendor.title,
          description: newVendor.description,
          custom_fields: {
            vendor_name: newVendor.title,
            contact_person: newVendor.contact_person,
            email: newVendor.email,
            phone: newVendor.phone,
            category: newVendor.category,
          },
        }),
      });
      setShowAddVendor(false);
      setNewVendor({ title: '', description: '', category: 'vendor', contact_person: '', email: '', phone: '' });
      fetchVendors();
      fetchStats();
    } catch (err) {
      console.error('Failed to add vendor:', err);
    }
  };

  const handleUpdateVendorStatus = async (vendorId, newStatus) => {
    try {
      await fetch(`/api/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchVendors();
      fetchStats();
    } catch (err) {
      console.error('Failed to update vendor:', err);
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    try {
      await fetch(`/api/vendors/${vendorId}`, { method: 'DELETE' });
      fetchVendors();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete vendor:', err);
    }
  };

  const handleAddDecision = async (e) => {
    e.preventDefault();
    try {
      // Get the decisions board for this event
      const boards = await fetch('/api/boards').then(r => r.json());
      const eventName = events.find(e => e.id === selectedEvent)?.name || 'Event';
      let decisionsBoard = boards.find(b => b.name === `${eventName} - Decisions`);

      // Create decisions board if it doesn't exist
      if (!decisionsBoard) {
        decisionsBoard = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${eventName} - Decisions`,
            workflow_id: 'client-decision',
          }),
        }).then(r => r.json());
      }

      await fetch(`/api/events/${decisionsBoard.id}/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDecision.title,
          description: newDecision.description,
          priority: newDecision.priority,
        }),
      });
      setShowAddDecision(false);
      setNewDecision({ title: '', description: '', priority: 'medium' });
      fetchDecisions();
      fetchStats();
    } catch (err) {
      console.error('Failed to add decision:', err);
    }
  };

  const handleUpdateDecisionStatus = async (decisionId, newStatus) => {
    try {
      await fetch(`/api/decisions/${decisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchDecisions();
      fetchStats();
    } catch (err) {
      console.error('Failed to update decision:', err);
    }
  };

  const handleDeleteDecision = async (decisionId) => {
    if (!confirm('Are you sure you want to delete this decision?')) return;
    try {
      await fetch(`/api/decisions/${decisionId}`, { method: 'DELETE' });
      fetchDecisions();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete decision:', err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      researching: '#9CA3AF',
      contacted: '#60A5FA',
      awaiting_response: '#FBBF24',
      proposal_received: '#34D399',
      client_review: '#A78BFA',
      negotiating: '#F59E0B',
      booked: '#10B981',
      confirmed: '#059669',
      completed: '#6B7280',
      declined: '#EF4444',
    };
    return colors[status] || '#9CA3AF';
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      urgent: { bg: '#FEE2E2', color: '#991B1B', label: 'URGENT' },
      high: { bg: '#FED7AA', color: '#9A3412', label: 'HIGH' },
      medium: { bg: '#FEF3C7', color: '#92400E', label: 'MEDIUM' },
      low: { bg: '#E0E7FF', color: '#3730A3', label: 'LOW' },
    };
    return styles[priority] || styles.medium;
  };

  const getDaysAgo = (date) => {
    const days = Math.floor((Date.now() - new Date(date)) / (1000 * 60 * 60 * 24));
    return days;
  };

  const isGhosting = (vendor) => {
    if (vendor.status !== 'awaiting_response') return false;
    const daysAgo = getDaysAgo(vendor.updated_at);
    return daysAgo >= 3;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Wedding Planner</h1>
        <select
          className="event-selector"
          value={selectedEvent || ''}
          onChange={(e) => setSelectedEvent(e.target.value)}
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </header>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total_vendors}</div>
            <div className="stat-label">Total Vendors</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.vendors_awaiting}</div>
            <div className="stat-label">Awaiting Response</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.vendors_booked}</div>
            <div className="stat-label">Booked</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pending_decisions}</div>
            <div className="stat-label">Pending Decisions</div>
          </div>
        </div>
      )}

      <div className="main-content">
        <section className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>Vendor Pipeline</h2>
            <button className="btn-primary" onClick={() => setShowAddVendor(true)}>
              + Add Vendor
            </button>
          </div>
          {vendors.filter(isGhosting).length > 0 && (
            <div className="alert alert-warning">
              ⚠️ {vendors.filter(isGhosting).length} vendor(s) may be ghosting (no response in 3+ days)
            </div>
          )}
          <div className="vendor-list">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="vendor-card">
                {isGhosting(vendor) && <div className="ghosting-badge">👻 Ghosting</div>}
                <div className="vendor-header">
                  <h3>{vendor.title}</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      className="status-dropdown"
                      value={vendor.status}
                      onChange={(e) => handleUpdateVendorStatus(vendor.id, e.target.value)}
                      style={{ backgroundColor: getStatusColor(vendor.status), color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}
                    >
                      <option value="researching">Researching</option>
                      <option value="contacted">Contacted</option>
                      <option value="awaiting_response">Awaiting Response</option>
                      <option value="proposal_received">Proposal Received</option>
                      <option value="client_review">Client Review</option>
                      <option value="negotiating">Negotiating</option>
                      <option value="booked">Booked</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="declined">Declined</option>
                    </select>
                    <button className="btn-danger-small" onClick={() => handleDeleteVendor(vendor.id)} title="Delete">
                      ×
                    </button>
                  </div>
                </div>
                {vendor.description && (
                  <p className="vendor-description">{vendor.description}</p>
                )}
                <div className="vendor-meta">
                  <span>Updated {getDaysAgo(vendor.updated_at)}d ago</span>
                  {vendor.metadata?.contact && (
                    <span className="contact-info">
                      📧 {vendor.metadata.contact.email} | 📞 {vendor.metadata.contact.phone}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>Client Decisions</h2>
            <button className="btn-primary" onClick={() => setShowAddDecision(true)}>
              + Add Decision
            </button>
          </div>
          <div className="decisions-list">
            {decisions.map((decision) => {
              const priority = getPriorityBadge(decision.priority);
              const daysAgo = getDaysAgo(decision.updated_at);
              return (
                <div key={decision.id} className="decision-card">
                  <div className="decision-header">
                    <h3>{decision.title}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span
                        className="priority-badge"
                        style={{ backgroundColor: priority.bg, color: priority.color }}
                      >
                        {priority.label}
                      </span>
                      <button className="btn-danger-small" onClick={() => handleDeleteDecision(decision.id)} title="Delete">
                        ×
                      </button>
                    </div>
                  </div>
                  {decision.description && (
                    <p className="decision-description">{decision.description}</p>
                  )}
                  <div className="decision-meta">
                    <select
                      className="status-dropdown"
                      value={decision.status}
                      onChange={(e) => handleUpdateDecisionStatus(decision.id, e.target.value)}
                      style={{ backgroundColor: '#6B7280', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}
                    >
                      <option value="drafting">Drafting</option>
                      <option value="ready_for_review">Ready for Review</option>
                      <option value="client_reviewing">Client Reviewing</option>
                      <option value="needs_discussion">Needs Discussion</option>
                      <option value="approved">Approved</option>
                      <option value="declined">Declined</option>
                    </select>
                    <span>Updated {daysAgo}d ago</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {showAddVendor && (
        <div className="modal-overlay" onClick={() => setShowAddVendor(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Vendor</h2>
            <form onSubmit={handleAddVendor}>
              <div className="form-group">
                <label>Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={newVendor.title}
                  onChange={(e) => setNewVendor({ ...newVendor, title: e.target.value })}
                  placeholder="e.g., Florist - Bloom & Wild"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newVendor.description}
                  onChange={(e) => setNewVendor({ ...newVendor, description: e.target.value })}
                  placeholder="Brief description of this vendor..."
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Contact Person</label>
                <input
                  type="text"
                  value={newVendor.contact_person}
                  onChange={(e) => setNewVendor({ ...newVendor, contact_person: e.target.value })}
                  placeholder="e.g., Maria Santos"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                    placeholder="vendor@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={newVendor.phone}
                    onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                    placeholder="555-0123"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddVendor(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddDecision && (
        <div className="modal-overlay" onClick={() => setShowAddDecision(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Decision</h2>
            <form onSubmit={handleAddDecision}>
              <div className="form-group">
                <label>Decision Title *</label>
                <input
                  type="text"
                  required
                  value={newDecision.title}
                  onChange={(e) => setNewDecision({ ...newDecision, title: e.target.value })}
                  placeholder="e.g., Choose wedding cake flavor"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newDecision.description}
                  onChange={(e) => setNewDecision({ ...newDecision, description: e.target.value })}
                  placeholder="Details about this decision..."
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label>Priority *</label>
                <select
                  value={newDecision.priority}
                  onChange={(e) => setNewDecision({ ...newDecision, priority: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.875rem' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddDecision(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
