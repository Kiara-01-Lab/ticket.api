import React, { useState, useEffect, useCallback } from 'react';
import Board from './components/Board';
import CreateTicketModal from './components/CreateTicketModal';
import CreateBoardModal from './components/CreateBoardModal';
import TicketDetailModal from './components/TicketDetailModal';
import SearchBar from './components/SearchBar';
import BoardSwitcher from './components/BoardSwitcher';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function App() {
  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [kanban, setKanban] = useState(null);
  const [filteredKanban, setFilteredKanban] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({});

  // Fetch boards on mount
  useEffect(() => {
    fetchBoards();
  }, []);

  // Fetch kanban view when active board changes
  useEffect(() => {
    if (activeBoard) {
      fetchKanban(activeBoard.id);
    }
  }, [activeBoard]);

  // Apply search/filter when kanban data or search params change
  useEffect(() => {
    if (!kanban) {
      setFilteredKanban(null);
      return;
    }

    // If no search query and no priority filter, show all tickets (excluding subtasks)
    const hasQuery = searchQuery && searchQuery.trim().length > 0;
    const hasPriority = searchFilters.priority && searchFilters.priority.length > 0;

    // Deep clone to avoid mutating original data
    const filtered = {
      ...kanban,
      columns: {}
    };

    const queryLower = searchQuery.trim().toLowerCase();

    Object.keys(kanban.columns).forEach(status => {
      filtered.columns[status] = kanban.columns[status].filter(ticket => {
        // ALWAYS exclude subtasks (tickets with parent_id)
        if (ticket.parent_id) {
          return false;
        }

        // If no filters, show all non-subtask tickets
        if (!hasQuery && !hasPriority) {
          return true;
        }

        // Search by query
        const matchesQuery = !hasQuery ||
          ticket.title.toLowerCase().includes(queryLower) ||
          ticket.description?.toLowerCase().includes(queryLower) ||
          ticket.labels?.some(l => l.toLowerCase().includes(queryLower));

        // Filter by priority
        const matchesPriority = !hasPriority ||
          ticket.priority === searchFilters.priority;

        return matchesQuery && matchesPriority;
      });
    });

    setFilteredKanban(filtered);
  }, [kanban, searchQuery, searchFilters]);

  async function fetchBoards() {
    try {
      const res = await fetch(`${API_URL}/boards`);
      const data = await res.json();
      setBoards(data);
      if (data.length > 0 && !activeBoard) {
        setActiveBoard(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch boards:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchKanban(boardId) {
    try {
      const res = await fetch(`${API_URL}/boards/${boardId}/kanban`);
      const data = await res.json();
      setKanban(data);
    } catch (err) {
      console.error('Failed to fetch kanban:', err);
    }
  }

  async function handleMoveTicket(ticketId, newStatus) {
    try {
      await fetch(`${API_URL}/tickets/${ticketId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      // Refresh the board
      fetchKanban(activeBoard.id);
    } catch (err) {
      console.error('Failed to move ticket:', err);
    }
  }

  async function handleCreateTicket(ticketData) {
    try {
      await fetch(`${API_URL}/boards/${activeBoard.id}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      });
      setShowCreateModal(false);
      fetchKanban(activeBoard.id);
    } catch (err) {
      console.error('Failed to create ticket:', err);
    }
  }

  async function handleCreateBoard(boardData) {
    try {
      const res = await fetch(`${API_URL}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boardData)
      });
      const newBoard = await res.json();
      setShowCreateBoardModal(false);

      // Refresh boards list and switch to new board
      await fetchBoards();
      setActiveBoard(newBoard);
    } catch (err) {
      console.error('Failed to create board:', err);
    }
  }

  async function handleDeleteTicket(ticketId) {
    try {
      await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: 'DELETE'
      });
      fetchKanban(activeBoard.id);
    } catch (err) {
      console.error('Failed to delete ticket:', err);
    }
  }

  function handleTicketClick(ticket) {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  }

  const handleSearch = useCallback((query, filters) => {
    setSearchQuery(query);
    setSearchFilters(filters);
  }, []);

  function handleBoardChange(board) {
    setActiveBoard(board);
    setSearchQuery('');
    setSearchFilters({});
  }

  if (loading) {
    return (
      <div className="app loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>🎫 ticket.api</h1>
          <BoardSwitcher
            boards={boards}
            activeBoard={activeBoard}
            onBoardChange={handleBoardChange}
            onCreateBoard={() => setShowCreateBoardModal(true)}
          />
        </div>
        <div className="header-center">
          <SearchBar onSearch={handleSearch} />
        </div>
        <div className="header-right">
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + New Ticket
          </button>
        </div>
      </header>

      <main className="main">
        {filteredKanban ? (
          <Board
            kanban={filteredKanban}
            onMoveTicket={handleMoveTicket}
            onDeleteTicket={handleDeleteTicket}
            onTicketClick={handleTicketClick}
          />
        ) : (
          <div className="empty-state">
            <p>No board selected</p>
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTicket}
        />
      )}

      {showCreateBoardModal && (
        <CreateBoardModal
          onClose={() => setShowCreateBoardModal(false)}
          onSubmit={handleCreateBoard}
        />
      )}

      {showDetailModal && selectedTicket && (
        <TicketDetailModal
          ticketId={selectedTicket.id}
          onClose={() => { setShowDetailModal(false); setSelectedTicket(null); }}
          onUpdate={() => fetchKanban(activeBoard.id)}
        />
      )}
    </div>
  );
}

export default App;
