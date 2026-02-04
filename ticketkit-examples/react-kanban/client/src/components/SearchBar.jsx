import React, { useState, useEffect } from 'react';

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('all');

  // Auto-search on input changes
  useEffect(() => {
    // If query is empty, reset priority to 'all'
    if (!query.trim()) {
      if (priority !== 'all') {
        setPriority('all');
        return; // Let the next effect run handle the onSearch
      }
    }

    // Call search with trimmed query
    const searchQuery = query.trim();
    const searchPriority = priority === 'all' ? '' : priority;

    onSearch(searchQuery, { priority: searchPriority });
  }, [query, priority, onSearch]);

  function handleClear() {
    setQuery('');
    setPriority('all');
    // Don't call onSearch here - let useEffect handle it
  }

  const hasQuery = query.trim().length > 0;
  const hasFilters = hasQuery || priority !== 'all';

  return (
    <div className="search-bar">
      <div className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tickets..."
            className="search-input"
          />
          {hasQuery && (
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="priority-filter"
            >
              <option value="all">All</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          )}
          {hasFilters && (
            <button
              type="button"
              className="clear-btn"
              onClick={handleClear}
              title="Clear filters"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchBar;
