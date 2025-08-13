import React from 'react';
import './SortSection.css';

const SortSection = ({ sortBy, sortOrder, onSort }) => {
  const handleSort = (newSortBy) => {
    onSort(newSortBy);
  };

  return (
    <div className="sort-section">
      <h3 className="sort-title">Sort By</h3>
      <div className="sort-buttons">
        <button
          className={`sort-button ${sortBy === 'name' ? 'active' : ''}`}
          onClick={() => handleSort('name')}
        >
          Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          className={`sort-button ${sortBy === 'published_this_year' ? 'active' : ''}`}
          onClick={() => handleSort('published_this_year')}
        >
          Published This Year {sortBy === 'published_this_year' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          className={`sort-button ${sortBy === 'published_last_year' ? 'active' : ''}`}
          onClick={() => handleSort('published_last_year')}
        >
          Published Last Year {sortBy === 'published_last_year' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          className={`sort-button ${sortBy === 'total_papers' ? 'active' : ''}`}
          onClick={() => handleSort('total_papers')}
        >
          Total Publications {sortBy === 'total_papers' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          className={`sort-button ${sortBy === 'avg_papers_per_year' ? 'active' : ''}`}
          onClick={() => handleSort('avg_papers_per_year')}
        >
          Average Per Year {sortBy === 'avg_papers_per_year' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>
    </div>
  );
};

export default SortSection; 