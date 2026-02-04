import React, { useState } from 'react';

function BoardSwitcher({ boards, activeBoard, onBoardChange, onCreateBoard }) {
  const [isOpen, setIsOpen] = useState(false);

  function handleSelectBoard(board) {
    onBoardChange(board);
    setIsOpen(false);
  }

  function handleCreateBoard() {
    setIsOpen(false);
    onCreateBoard();
  }

  if (!boards || boards.length === 0) {
    return <span className="board-name">No boards</span>;
  }

  return (
    <div className="board-switcher">
      <button
        className="board-switcher-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="board-name">{activeBoard?.name || 'Select board'}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div className="dropdown-overlay" onClick={() => setIsOpen(false)} />
          <div className="board-dropdown">
            {boards.map(board => (
              <button
                key={board.id}
                className={`board-option ${activeBoard?.id === board.id ? 'active' : ''}`}
                onClick={() => handleSelectBoard(board)}
              >
                <span>{board.name}</span>
                {activeBoard?.id === board.id && <span className="check-mark">✓</span>}
              </button>
            ))}
            <div className="board-dropdown-divider" />
            <button
              className="board-option create-board-option"
              onClick={handleCreateBoard}
            >
              <span>+ New Board</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default BoardSwitcher;
