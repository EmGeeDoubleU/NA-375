import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../SearchBar/SearchBar';
import FilterSidebar from '../FilterSidebar/FilterSidebar';
import './Layout.css';

const Layout = ({ children, professors = [], universities = [], selectedUniversities = [], toggleUniversity, availableFields = [], selectedFields = [], toggleField, onSearchResults }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [allProfessors, setAllProfessors] = useState([]);
  const navigate = useNavigate();

  // Fetch all professors for search functionality
  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/professors?limit=1000');
        const data = await response.json();
        
        // Handle paginated response
        if (data.professors) {
          setAllProfessors(data.professors);
        } else {
          // Fallback for non-paginated response
          setAllProfessors(data);
        }
      } catch (error) {
        console.error('Error fetching professors for search:', error);
      }
    };

    fetchProfessors();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleViewPublications = (professorId) => {
    navigate(`/professor/${professorId}`);
    setSidebarOpen(false);
  };

  const handleDashboardClick = () => {
    navigate('/');
  };

  return (
    <div className="layout">
      {/* Header Bar */}
      <div className="header-bar">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M1 2.75A.75.75 0 011.75 2h12.5a.75.75 0 010 1.5H1.75A.75.75 0 011 2.75zm0 5A.75.75 0 011.75 7h12.5a.75.75 0 010 1.5H1.75A.75.75 0 011 7.75zM1.75 12a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H1.75z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="header-title">
          <button className="header-text-button" onClick={handleDashboardClick}>
            Dashboard
          </button>
        </div>
        <div className="header-search">
          <SearchBar professors={allProfessors} onSearchResults={onSearchResults} />
        </div>
      </div>

      <div className="layout-content">
        {/* Sidebar - only show on main page */}
        {universities.length > 0 && (
          <FilterSidebar 
            universities={universities}
            selectedUniversities={selectedUniversities}
            toggleUniversity={toggleUniversity}
            availableFields={availableFields}
            selectedFields={selectedFields}
            toggleField={toggleField}
            isOpen={sidebarOpen}
          />
        )}

        {/* Main Content */}
        <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout; 