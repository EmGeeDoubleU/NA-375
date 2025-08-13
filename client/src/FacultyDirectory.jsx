import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePhoto from './components/ProfilePhoto/ProfilePhoto';
import SearchBar from './components/SearchBar/SearchBar';
import FilterSidebar from './components/FilterSidebar/FilterSidebar';
import ProfessorCard from './components/ProfessorCard/ProfessorCard';
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
  
  // Available fields for filtering
  const availableFields = [
    "Computer Science", "Biology", "Chemistry", "Physics", 
    "Mathematics", "Engineering", "Medicine", "Psychology", 
    "Economics", "Political Science"
  ];

  // University colors for banners
  const universityColors = {
    'Drexel University': '#1e3a8a',
    'University of Pennsylvania': '#dc2626',
    'Temple University': '#f59e0b',
    'Thomas Jefferson University': '#7c3aed',
    'Other': '#6b7280'
  };

  // Function to generate initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

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

  const getMetricColor = (value, type) => {
    if (type === 'published') {
      return value === 'Yes' ? '#10b981' : '#ef4444';
    }
    if (type === 'total') {
      const num = parseInt(value);
      if (num >= 40) return '#10b981';
      if (num >= 25) return '#f59e0b';
      return '#ef4444';
    }
    if (type === 'average') {
      const num = parseInt(value);
      if (num >= 8) return '#10b981';
      if (num >= 5) return '#f59e0b';
      return '#ef4444';
    }
    return '#6b7280';
  };

  // Determine if a professor is a top researcher
  const isTopResearcher = (professor) => {
    return professor.total_papers >= 300 && 
           (professor.published_this_year === 'Yes' || professor.published_last_year === 'Yes') &&
           professor.avg_papers_per_year >= 6;
  };

  // Sort professors with top researchers first, then by the selected criteria
  const sortedProfessors = useMemo(() => {
    const filtered = professors.filter(professor => {
      const universityMatch = selectedUniversities.length === 0 || 
                             selectedUniversities.includes(professor.university_name);
      const fieldMatch = selectedFields.length === 0 || 
                        selectedFields.includes(professor.department_name);
      return universityMatch && fieldMatch;
    });

    // Separate top researchers from others
    const topResearchers = filtered.filter(isTopResearcher);
    const otherProfessors = filtered.filter(prof => !isTopResearcher(prof));

    // Sort each group by the selected criteria
    const sortProfessors = (profList) => {
      return profList.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'published_this_year':
            aValue = a.published_this_year === 'Yes' ? 1 : 0;
            bValue = b.published_this_year === 'Yes' ? 1 : 0;
            break;
          case 'published_last_year':
            aValue = a.published_last_year === 'Yes' ? 1 : 0;
            bValue = b.published_last_year === 'Yes' ? 1 : 0;
            break;
          case 'total_papers':
            aValue = a.total_papers;
            bValue = b.total_papers;
            break;
          case 'avg_papers_per_year':
            aValue = a.avg_papers_per_year;
            bValue = b.avg_papers_per_year;
            break;
          default:
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    };

    // Sort both groups and combine with top researchers first
    const sortedTopResearchers = sortProfessors(topResearchers);
    const sortedOtherProfessors = sortProfessors(otherProfessors);
    
    return [...sortedTopResearchers, ...sortedOtherProfessors];
  }, [professors, selectedUniversities, selectedFields, sortBy, sortOrder]);

  const filteredProfessors = professors.filter(professor => {
    const universityMatch = selectedUniversities.length === 0 || 
      selectedUniversities.includes(professor.university_name);
    const fieldMatch = selectedFields.length === 0 || 
      selectedFields.includes(professor.department_name);
    return universityMatch && fieldMatch;
  });

  if (loading) {
    return (
      <div className="faculty-directory">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading faculty directory...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="faculty-directory">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="faculty-directory">
      <div className="faculty-layout">
        {/* Sidebar */}
        <FilterSidebar 
          universities={universities}
          selectedUniversities={selectedUniversities}
          toggleUniversity={toggleUniversity}
          availableFields={availableFields}
          selectedFields={selectedFields}
          toggleField={toggleField}
        />

        {/* Main Content */}
        <div className="main-content">
          {/* Search Section */}
          <SearchBar professors={professors} />

          {/* Sort Section */}
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
        </div>
      </div>
    </div>
  );
};

export default FacultyDirectory; 