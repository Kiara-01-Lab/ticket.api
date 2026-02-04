import React from 'react';

const ACTION_ICONS = {
  created: '✨',
  updated: '✏️',
  status_changed: '🔄',
  assigned: '👤',
  commented: '💬'
};

function ActivityTimeline({ activities }) {
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  }

  function formatActivity(activity) {
    const icon = ACTION_ICONS[activity.action] || '•';
    const actor = activity.actor || 'Someone';

    switch (activity.action) {
      case 'created':
        return `${icon} ${actor} created this ticket`;

      case 'status_changed':
        const from = activity.changes?.status?.old || 'unknown';
        const to = activity.changes?.status?.new || 'unknown';
        return `${icon} ${actor} moved from ${from} to ${to}`;

      case 'updated':
        const fields = Object.keys(activity.changes || {}).join(', ');
        return `${icon} ${actor} updated ${fields}`;

      case 'assigned':
        return `${icon} ${actor} assigned this ticket`;

      case 'commented':
        return `${icon} ${actor} commented`;

      default:
        return `${icon} ${actor} performed ${activity.action}`;
    }
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="activity-timeline empty">
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className="activity-timeline">
      {activities.map(activity => (
        <div key={activity.id} className="activity-item">
          <div className="activity-content">
            <span className="activity-text">{formatActivity(activity)}</span>
          </div>
          <div className="activity-time">{formatTime(activity.created_at)}</div>
        </div>
      ))}
    </div>
  );
}

export default ActivityTimeline;
