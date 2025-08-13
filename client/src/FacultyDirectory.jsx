import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePhoto from './components/ProfilePhoto/ProfilePhoto';
import Layout from './components/Layout/Layout';
import ProfessorCard from './components/ProfessorCard/ProfessorCard';
import SortSection from './components/SortSection/SortSection';
import { 
  availableFields, 
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
  const navigate = useNavigate();
  
  // Filter states
  const [selectedUniversities, setSelectedUniversities] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  
  // Sorting state
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data concurrently instead of sequentially
      const [professorsResponse, universitiesResponse, departmentsResponse] = await Promise.all([
        fetch('http://localhost:5001/api/professors'),
        fetch('http://localhost:5001/api/universities'),
        fetch('http://localhost:5001/api/departments')
      ]);
      
      const [professorsData, universitiesData, departmentsData] = await Promise.all([
        professorsResponse.json(),
        universitiesResponse.json(),
        departmentsResponse.json()
      ]);
      
      setProfessors(professorsData);
      setUniversities(universitiesData);
      setDepartments(departmentsData);
      
    } catch (err) {
      setError('Failed to fetch data from server');
      console.error('Error fetching data:', err);
    } finally {
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

  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc'); // Default to descending for metrics, ascending for names
    }
  };

  // Sort professors with top researchers first, then by the selected criteria
  const sortedProfessors = useMemo(() => {
    return sortProfessors(professors, selectedUniversities, selectedFields, sortBy, sortOrder);
  }, [professors, selectedUniversities, selectedFields, sortBy, sortOrder]);

  const filteredProfessors = filterProfessors(professors, selectedUniversities, selectedFields);

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading faculty directory...</div>
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
    >
      {/* Sort Section */}
      <SortSection 
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Results Count */}
      <div className="results-count">
        Showing {sortedProfessors.length} professor{sortedProfessors.length !== 1 ? 's' : ''}
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