import React, { useState } from 'react';
import Column from './Column';

const COLUMN_ORDER = ['backlog', 'todo', 'in_progress', 'review', 'done'];

const COLUMN_LABELS = {
  backlog: '📥 Backlog',
  todo: '📋 To Do',
  in_progress: '🔨 In Progress',
  review: '👀 Review',
  done: '✅ Done'
};

function Board({ kanban, onMoveTicket, onDeleteTicket, onTicketClick }) {
  const [draggedTicket, setDraggedTicket] = useState(null);

  function handleDragStart(ticket) {
    setDraggedTicket(ticket);
  }

  function handleDragEnd() {
    setDraggedTicket(null);
  }

  function handleDrop(newStatus) {
    if (draggedTicket && draggedTicket.status !== newStatus) {
      onMoveTicket(draggedTicket.id, newStatus);
    }
    setDraggedTicket(null);
  }

  return (
    <div className="board">
      {COLUMN_ORDER.map(status => (
        <Column
          key={status}
          status={status}
          label={COLUMN_LABELS[status]}
          tickets={kanban.columns[status] || []}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          onDeleteTicket={onDeleteTicket}
          onTicketClick={onTicketClick}
          isDragTarget={draggedTicket && draggedTicket.status !== status}
        />
      ))}
    </div>
  );
}

export default Board;
