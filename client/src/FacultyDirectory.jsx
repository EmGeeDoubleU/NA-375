import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePhoto from './components/ProfilePhoto/ProfilePhoto';
import Layout from './components/Layout/Layout';
import ProfessorCard from './components/ProfessorCard/ProfessorCard';
import SortSection from './components/SortSection/SortSection';
import { 
  availableFields, 
  fetchAvailableFields,
  universityColors, 
  getInitials, 
  isTopResearcher, 
  getMetricColor, 
  sortProfessors, 
  filterProfessors 
} from './utils/facultyUtils';
import './FacultyDirectory.css';

const FacultyDirectory = () => {
  const [professors, setProfessors] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const navigate = useNavigate();
  
  // Total count state
  const [totalProfessors, setTotalProfessors] = useState(0);
  
  // Filter states
  const [selectedUniversities, setSelectedUniversities] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  
  // Search results state
  const [searchResults, setSearchResults] = useState(null);
  
  // Sorting state
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    fetchData();
  }, []);

  // Add scroll listener for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Load all professors at once for proper sorting
      const professorsResponse = await fetch('http://localhost:5001/api/professors?limit=1000');
      const professorsData = await professorsResponse.json();
      
      // Handle paginated professors response
      if (professorsData.professors) {
        setProfessors(professorsData.professors);
        setTotalProfessors(professorsData.pagination.total);
      } else {
        // Fallback for non-paginated response
        setProfessors(professorsData);
        setTotalProfessors(professorsData.length);
      }
      
      // Stop loading here so users see professors immediately
      setLoading(false);
      
      // Load filters and other data in background (non-blocking)
      try {
        const [universitiesResponse, departmentsResponse] = await Promise.all([
          fetch('http://localhost:5001/api/universities'),
          fetch('http://localhost:5001/api/departments')
        ]);
        
        const [universitiesData, departmentsData] = await Promise.all([
          universitiesResponse.json(),
          departmentsResponse.json()
        ]);
        
        setUniversities(universitiesData);
        setDepartments(departmentsData);
        
        // Fetch available fields and department mappings from the database
        await fetchAvailableFields();
      } catch (filterErr) {
        console.error('Error loading filters:', filterErr);
        // Don't show error to user since main content is loaded
      }
      
    } catch (err) {
      setError('Failed to fetch data from server');
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };



  // Filter functions
  const toggleUniversity = (universityName) => {
    setSelectedUniversities(prev => 
      prev.includes(universityName)
        ? prev.filter(u => u !== universityName)
        : [...prev, universityName]
    );
  };

  const toggleField = (field) => {
    setSelectedFields(prev => 
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleViewPublications = (professorId) => {
    navigate(`/professor/${professorId}`);
  };

  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  const clearSearchResults = () => {
    setSearchResults(null);
  };

  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc'); // Default to descending for metrics, ascending for names
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Sort professors with top researchers first, then by the selected criteria
  const sortedProfessors = useMemo(() => {
    // If search results are active, use those instead of filtered professors
    const professorsToSort = searchResults || professors;
    return sortProfessors(professorsToSort, selectedUniversities, selectedFields, sortBy, sortOrder);
  }, [professors, selectedUniversities, selectedFields, sortBy, sortOrder, searchResults]);

  const filteredProfessors = filterProfessors(professors, selectedUniversities, selectedFields);

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading faculty directory...</div>
        </div>
        
        {/* Loading Skeleton for Professors */}
        <div className="professors-grid">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="professor-card-skeleton">
              <div className="skeleton-avatar"></div>
              <div className="skeleton-content">
                <div className="skeleton-name"></div>
                <div className="skeleton-position"></div>
                <div className="skeleton-metrics">
                  <div className="skeleton-metric"></div>
                  <div className="skeleton-metric"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="error">Error: {error}</div>
      </Layout>
    );
  }

  return (
    <Layout 
      professors={professors}
      universities={universities}
      selectedUniversities={selectedUniversities}
      toggleUniversity={toggleUniversity}
      availableFields={availableFields}
      selectedFields={selectedFields}
      toggleField={toggleField}
      onSearchResults={handleSearchResults}
    >
      {/* Back to top button */}
      {showBackToTop && (
        <button className="back-to-top-button" onClick={scrollToTop}>
          ↑
        </button>
      )}

      {/* Sort Section */}
      <SortSection 
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Search Results Clear Button */}
      {searchResults && (
        <div className="search-results-header">
          <div className="search-results-info">
            Showing {searchResults.length} search result{searchResults.length !== 1 ? 's' : ''} for your search
          </div>
          <button 
            className="clear-search-button"
            onClick={clearSearchResults}
          >
            Clear Search Results
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="results-count">
        {searchResults ? (
          `Showing ${searchResults.length} search result${searchResults.length !== 1 ? 's' : ''}`
        ) : (
          `Showing ${sortedProfessors.length} of ${totalProfessors} professor${totalProfessors !== 1 ? 's' : ''}`
        )}
      </div>

      {/* Professors Grid */}
      <div className="professors-grid">
        {sortedProfessors.length > 0 ? (
          sortedProfessors.map(professor => (
            <ProfessorCard
              key={professor.id}
              professor={professor}
              isTopResearcher={isTopResearcher}
              universityColors={universityColors}
              onViewPublications={handleViewPublications}
            />
          ))
        ) : (
          <div className="no-results">
            <p>No professors found matching your filters.</p>
            <button 
              className="clear-filters-button"
              onClick={() => {
                setSelectedUniversities([]);
                setSelectedFields([]);
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>


    </Layout>
  );
};

export default FacultyDirectory; 