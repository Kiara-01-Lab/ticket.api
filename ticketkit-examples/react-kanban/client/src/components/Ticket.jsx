import React, { useState, useEffect, useRef } from 'react';

const PRIORITY_COLORS = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e'
};

const PRIORITY_LABELS = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low'
};

function Ticket({ ticket, onDragStart, onDragEnd, onDelete, onClick }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;

    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  function handleDragStart(e) {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(ticket);
    setShowMenu(false); // Close menu when dragging
  }

  function handleDragEnd() {
    onDragEnd();
  }

  function handleDelete() {
    if (confirm(`Delete "${ticket.title}"?`)) {
      onDelete(ticket.id);
    }
    setShowMenu(false);
  }

  function handleClick(e) {
    // Don't trigger click if clicking on menu or buttons
    if (!e.target.closest('.menu-btn') && !e.target.closest('.ticket-menu')) {
      setShowMenu(false); // Close menu when opening detail view
      onClick(ticket);
    }
  }

  function toggleMenu(e) {
    e.stopPropagation();
    setShowMenu(!showMenu);
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = ticket.due_date && new Date(ticket.due_date) < new Date() && ticket.status !== 'done';

  return (
    <div
      className="ticket"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <div className="ticket-header">
        <span
          className="priority-badge"
          style={{ backgroundColor: PRIORITY_COLORS[ticket.priority] }}
          title={PRIORITY_LABELS[ticket.priority]}
        />
        {ticket.due_date && (
          <span className={`due-date-badge ${isOverdue ? 'overdue' : ''}`}>
            {formatDate(ticket.due_date)}
          </span>
        )}
        <div className="menu-container" ref={menuRef}>
          <button className="menu-btn" onClick={toggleMenu}>
            ⋮
          </button>
          {showMenu && (
            <div className="ticket-menu">
              <button onClick={handleDelete}>Delete</button>
            </div>
          )}
        </div>
      </div>
      
      <h3 className="ticket-title">{ticket.title}</h3>
      
      {ticket.description && (
        <p className="ticket-description">{ticket.description}</p>
      )}
      
      {ticket.labels && ticket.labels.length > 0 && (
        <div className="ticket-labels">
          {ticket.labels.map(label => (
            <span key={label} className="label">{label}</span>
          ))}
        </div>
      )}
      
      <div className="ticket-footer">
        {ticket.assignees && ticket.assignees.length > 0 && (
          <div className="assignees">
            {ticket.assignees.map(assignee => (
              <span key={assignee} className="assignee" title={assignee}>
                {assignee[0].toUpperCase()}
              </span>
            ))}
          </div>
        )}
        <span className="ticket-id">#{ticket.id.slice(0, 6)}</span>
      </div>
    </div>
  );
}

export default Ticket;
