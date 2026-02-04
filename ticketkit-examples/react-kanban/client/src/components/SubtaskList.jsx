import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function SubtaskList({ ticketId, onSubtasksChange }) {
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    fetchSubtasks();
  }, [ticketId]);

  async function fetchSubtasks() {
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}/subtasks`);
      const data = await res.json();
      setSubtasks(data);

      // Notify parent of subtask count changes
      if (onSubtasksChange) {
        const incompleteCount = data.filter(st => st.status !== 'done').length;
        onSubtasksChange(incompleteCount);
      }
    } catch (err) {
      console.error('Failed to fetch subtasks:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleSubtask(subtaskId, currentStatus) {
    try {
      if (currentStatus === 'done') {
        // Unchecking: move back through workflow to todo
        // done -> review -> in_progress -> todo
        const transitions = ['review', 'in_progress', 'todo'];

        for (const status of transitions) {
          await fetch(`${API_URL}/tickets/${subtaskId}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          });
        }
      } else {
        // Checking: move to done following full workflow
        // Workflow: backlog -> todo -> in_progress -> review -> done
        const transitions = [];

        if (currentStatus === 'backlog') {
          transitions.push('todo', 'in_progress', 'review', 'done');
        } else if (currentStatus === 'todo') {
          transitions.push('in_progress', 'review', 'done');
        } else if (currentStatus === 'in_progress') {
          transitions.push('review', 'done');
        } else if (currentStatus === 'review') {
          transitions.push('done');
        }

        // Execute all transitions in sequence
        for (const status of transitions) {
          await fetch(`${API_URL}/tickets/${subtaskId}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          });
        }
      }

      fetchSubtasks();
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
    }
  }

  async function handleAddSubtask(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await fetch(`${API_URL}/tickets/${ticketId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          priority: 'medium'
        })
      });

      setNewTitle('');
      setShowForm(false);
      fetchSubtasks();
    } catch (err) {
      console.error('Failed to create subtask:', err);
    }
  }

  // Sort: incomplete first, then completed
  const sortedSubtasks = [...subtasks].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    return 0;
  });

  const completedCount = subtasks.filter(st => st.status === 'done').length;
  const incompleteCount = subtasks.filter(st => st.status !== 'done').length;
  const totalCount = subtasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) {
    return <div className="subtasks-loading">Loading subtasks...</div>;
  }

  return (
    <div className="subtask-list">
      <div className="subtask-header">
        <h4>Subtasks</h4>
        {totalCount > 0 && (
          <span className="subtask-count">
            {completedCount}/{totalCount}
          </span>
        )}
      </div>

      {totalCount > 0 && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="subtask-items">
        {sortedSubtasks.map(subtask => (
          <div key={subtask.id} className="subtask-item">
            <input
              type="checkbox"
              checked={subtask.status === 'done'}
              onChange={() => handleToggleSubtask(subtask.id, subtask.status)}
            />
            <span className={subtask.status === 'done' ? 'completed' : ''}>
              {subtask.title}
            </span>
          </div>
        ))}
      </div>

      {showForm ? (
        <form onSubmit={handleAddSubtask} className="subtask-form">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Subtask title..."
            autoFocus
          />
          <div className="subtask-form-actions">
            <button type="submit" className="btn btn-sm btn-primary">Add</button>
            <button type="button" className="btn btn-sm" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button className="btn btn-sm" onClick={() => setShowForm(true)}>
          + Add Subtask
        </button>
      )}
    </div>
  );
}

export default SubtaskList;
