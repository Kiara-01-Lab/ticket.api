import React, { useState } from 'react';
import Ticket from './Ticket';

function Column({
  status,
  label,
  tickets,
  onDragStart,
  onDragEnd,
  onDrop,
  onDeleteTicket,
  onTicketClick,
  isDragTarget
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(e) {
    e.preventDefault();
    if (isDragTarget) {
      setIsDragOver(true);
    }
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(status);
  }

  return (
    <div 
      className={`column ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <h2>{label}</h2>
        <span className="count">{tickets.length}</span>
      </div>
      
      <div className="column-content">
        {tickets.length === 0 ? (
          <div className="empty-column">
            {isDragTarget ? 'Drop here' : 'No tickets'}
          </div>
        ) : (
          tickets.map(ticket => (
            <Ticket
              key={ticket.id}
              ticket={ticket}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDelete={onDeleteTicket}
              onClick={onTicketClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Column;
