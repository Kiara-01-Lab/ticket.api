import React, { useState, useEffect } from 'react';
import ActivityTimeline from './ActivityTimeline';
import SubtaskList from './SubtaskList';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const PRIORITY_COLORS = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e'
};

function TicketDetailModal({ ticketId, onClose, onUpdate }) {
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comments');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [incompleteSubtaskCount, setIncompleteSubtaskCount] = useState(0);

  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [labels, setLabels] = useState('');
  const [assignees, setAssignees] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title || '');
      setDescription(ticket.description || '');
      setPriority(ticket.priority || 'medium');
      setLabels(ticket.labels ? ticket.labels.join(', ') : '');
      setAssignees(ticket.assignees ? ticket.assignees.join(', ') : '');
      setDueDate(ticket.due_date ? ticket.due_date.split('T')[0] : '');
    }
  }, [ticket]);

  useEffect(() => {
    if (!ticket) return;

    const changed =
      title !== (ticket.title || '') ||
      description !== (ticket.description || '') ||
      priority !== (ticket.priority || 'medium') ||
      labels !== (ticket.labels ? ticket.labels.join(', ') : '') ||
      assignees !== (ticket.assignees ? ticket.assignees.join(', ') : '') ||
      dueDate !== (ticket.due_date ? ticket.due_date.split('T')[0] : '');

    setHasChanges(changed);
  }, [title, description, priority, labels, assignees, dueDate, ticket]);

  async function fetchTicketDetails() {
    try {
      const [ticketRes, commentsRes, activityRes] = await Promise.all([
        fetch(`${API_URL}/tickets/${ticketId}`),
        fetch(`${API_URL}/tickets/${ticketId}/comments`),
        fetch(`${API_URL}/tickets/${ticketId}/activity`)
      ]);

      if (!ticketRes.ok) {
        throw new Error(`Failed to fetch ticket: ${ticketRes.status}`);
      }

      const ticketData = await ticketRes.json();
      const commentsData = commentsRes.ok ? await commentsRes.json() : [];
      const activityData = activityRes.ok ? await activityRes.json() : [];

      setTicket(ticketData);
      setComments(commentsData);
      setActivity(activityData);
    } catch (err) {
      console.error('Failed to fetch ticket details:', err);
      alert('Failed to load ticket details. Please try again.');
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSubmitting(true);
    try {
      const updates = {
        title: title.trim(),
        description: description.trim(),
        priority,
        labels: labels.split(',').map(l => l.trim()).filter(Boolean),
        assignees: assignees.split(',').map(a => a.trim()).filter(Boolean),
        due_date: dueDate || null
      };

      await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      await fetchTicketDetails();
      setHasChanges(false);

      // Notify parent to refresh the board
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Failed to update ticket:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await fetch(`${API_URL}/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          author: 'You'
        })
      });

      setNewComment('');
      fetchTicketDetails();
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !ticket) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-large" onClick={e => e.stopPropagation()}>
          <div className="loading">Loading ticket details...</div>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString();
  };

  const isOverdue = ticket.due_date && new Date(ticket.due_date) < new Date() && ticket.status !== 'done';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-top">
            <div className="ticket-id-badge">#{ticket.id.slice(0, 8)}</div>
            <div className="modal-actions-header">
              {hasChanges && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleSave}
                  disabled={submitting || !title.trim()}
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              )}
              <button className="close-btn" onClick={onClose}>×</button>
            </div>
          </div>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="ticket-title-input"
            placeholder="Ticket title"
          />
          <div className="ticket-meta">
            <span
              className="priority-badge-inline"
              style={{ backgroundColor: PRIORITY_COLORS[priority] }}
            >
              {priority.toUpperCase()}
            </span>
            <span className="status-badge-inline">{ticket.status.replace('_', ' ').toUpperCase()}</span>
            {dueDate && (
              <span className={`due-date-inline ${isOverdue ? 'overdue' : ''}`}>
                {formatDate(dueDate)}
                {isOverdue && ' • OVERDUE'}
              </span>
            )}
          </div>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h3>Description</h3>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="ticket-description-textarea"
              placeholder="Add a description..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Labels (comma-separated)</label>
            <input
              type="text"
              value={labels}
              onChange={e => setLabels(e.target.value)}
              placeholder="e.g. bug, frontend, urgent"
            />
          </div>

          <div className="form-group">
            <label>Assignees (comma-separated)</label>
            <input
              type="text"
              value={assignees}
              onChange={e => setAssignees(e.target.value)}
              placeholder="e.g. Alice, Bob"
            />
          </div>

          <div className="detail-tabs">
            <button
              className={`tab ${activeTab === 'comments' ? 'active' : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              Comments ({comments.length})
            </button>
            <button
              className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}>
              Activity ({activity.length})
            </button>
            <button
              className={`tab ${activeTab === 'subtasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('subtasks')}
            >
              Subtasks {incompleteSubtaskCount > 0 && `(${incompleteSubtaskCount})`}
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'comments' && (
              <div className="comments-section">
                <div className="comments-list">
                  {comments.length === 0 ? (
                    <p className="empty-state">No comments yet.</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-header">
                          <span className="comment-author">
                            <span className="author-avatar">{comment.author[0].toUpperCase()}</span>
                            {comment.author}
                          </span>
                          <span className="comment-time">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="comment-content">{comment.content}</div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="comment-form">
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                  />
                  <button
                    type="submit"
                    className="btn btn-sm"
                    disabled={!newComment.trim() || submitting}
                  >
                    {submitting ? 'Adding...' : 'Add Comment'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="activity-section">
                <ActivityTimeline activities={activity} />
              </div>
            )}

            {activeTab === 'subtasks' && (
              <div className="subtasks-section">
                <SubtaskList
                  ticketId={ticketId}
                  onSubtasksChange={setIncompleteSubtaskCount}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketDetailModal;
