import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePhoto from '../ProfilePhoto/ProfilePhoto';
import './SearchBar.css';

const SearchBar = ({ professors }) => {
  const navigate = useNavigate();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);

  // Search functions
  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return professors.filter(professor => {
      const name = professor.name.toLowerCase();
      const department = professor.department_name.toLowerCase();
      const university = professor.university_name.toLowerCase();
      
      return name.includes(query) || 
             department.includes(query) || 
             university.includes(query);
    }).slice(0, 8); // Limit to 8 results
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchDropdown(value.length > 0);
    setSelectedSearchIndex(-1);
  };

  const handleSearchKeyDown = (e) => {
    const results = getSearchResults();
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSearchIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSearchIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSearchIndex >= 0 && results[selectedSearchIndex]) {
        navigateToProfessor(results[selectedSearchIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSearchDropdown(false);
      setSearchQuery('');
      setSelectedSearchIndex(-1);
    }
  };

  const navigateToProfessor = (professor) => {
    navigate(`/professor/${professor.id}`);
    setShowSearchDropdown(false);
    setSearchQuery('');
    setSelectedSearchIndex(-1);
  };

  const handleSearchFocus = () => {
    if (searchQuery.length > 0) {
      setShowSearchDropdown(true);
    }
  };

  const handleSearchBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => {
      setShowSearchDropdown(false);
      setSelectedSearchIndex(-1);
    }, 200);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchDropdown(false);
    setSelectedSearchIndex(-1);
  };

  return (
    <div className="search-section">
      <div className="search-container">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M11.5 7a4.499 4.499 0 11-8.998 0A4.499 4.499 0 0111.5 7zm-.82 4.74a6 6 0 111.06-1.06l3.04 3.04a.75.75 0 11-1.06 1.06l-3.04-3.04z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search for researchers by name or university..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            onKeyDown={handleSearchKeyDown}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={clearSearch}
            >
              ×
            </button>
          )}
        </div>
        
        {showSearchDropdown && (
          <div className="search-dropdown">
            {getSearchResults().length > 0 ? (
              getSearchResults().map((professor, index) => (
                <div
                  key={professor.id}
                  className={`search-result ${index === selectedSearchIndex ? 'selected' : ''}`}
                  onClick={() => navigateToProfessor(professor)}
                  onMouseEnter={() => setSelectedSearchIndex(index)}
                >
                  <div className="search-result-avatar">
                    <ProfilePhoto professor={professor} />
                  </div>
                  <div className="search-result-info">
                    <div className="search-result-name">{professor.name}</div>
                    <div className="search-result-details">
                      {professor.department_name} • {professor.university_name}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="search-no-results">
                No professors found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar; 