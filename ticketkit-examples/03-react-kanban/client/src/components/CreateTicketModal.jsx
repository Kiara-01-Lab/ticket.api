import React, { useState } from 'react';

function CreateTicketModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [labels, setLabels] = useState('');
  const [assignees, setAssignees] = useState('');
  const [dueDate, setDueDate] = useState('');

  function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      labels: labels.split(',').map(l => l.trim()).filter(Boolean),
      assignees: assignees.split(',').map(a => a.trim()).filter(Boolean),
      due_date: dueDate || null
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Ticket</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={priority}
                onChange={e => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="due-date">Due Date</label>
              <input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="labels">Labels</label>
            <input
              id="labels"
              type="text"
              value={labels}
              onChange={e => setLabels(e.target.value)}
              placeholder="bug, frontend, urgent (comma-separated)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="assignees">Assignees</label>
            <input
              id="assignees"
              type="text"
              value={assignees}
              onChange={e => setAssignees(e.target.value)}
              placeholder="alice, bob, charlie (comma-separated)"
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
              Create Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTicketModal;
