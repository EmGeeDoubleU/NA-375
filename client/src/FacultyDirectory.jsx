import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  
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

  // Profile Photo Component with error handling
  const ProfilePhoto = ({ professor }) => {
    const [imageError, setImageError] = useState(false);
    
    // If no headshot or image failed to load, show initials
    if (!professor.headshot || imageError) {
      return (
        <div className="professor-avatar-initials">
          {getInitials(professor.name)}
        </div>
      );
    }
    
    // Try to load the image, fallback to initials on error
    return (
      <img 
        src={professor.headshot} 
        alt={professor.name}
        className="professor-avatar"
        onError={() => setImageError(true)}
      />
    );
  };

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
        <div className="sidebar">
          <div className="sidebar-content">
            <h2 className="sidebar-title">Browse & Filter</h2>
            
            {/* University Filters */}
            <div className="filter-group">
              <h3 className="filter-group-title">Universities</h3>
              <div className="filter-buttons">
                {universities.map(uni => (
                  <button
                    key={uni.id}
                    className={`filter-button ${selectedUniversities.includes(uni.name) ? 'selected' : ''}`}
                    onClick={() => toggleUniversity(uni.name)}
                  >
                    {uni.name === 'Drexel University' ? 'Drexel' : 
                     uni.name === 'University of Pennsylvania' ? 'Upenn' :
                     uni.name === 'Temple University' ? 'Temple' :
                     uni.name === 'Thomas Jefferson University' ? 'Jefferson' : 'Other'}
                  </button>
                ))}
              </div>
            </div>

            {/* Field Filters */}
            <div className="filter-group">
              <h3 className="filter-group-title">Fields of Interest</h3>
              <div className="filter-buttons">
                {availableFields.map(field => (
                  <button
                    key={field}
                    className={`filter-button ${selectedFields.includes(field) ? 'selected' : ''}`}
                    onClick={() => toggleField(field)}
                  >
                    {field}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Search Section */}
          <div className="search-section">
            <div className="search-container">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Search professors by name, department, or university..."
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
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchDropdown(false);
                      setSelectedSearchIndex(-1);
                    }}
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
                <div key={professor.id} className={`professor-card ${isTopResearcher(professor) ? 'top-researcher' : ''}`}>
                  {isTopResearcher(professor) && (
                    <div className="top-researcher-badge">
                      🔥 Top Researcher
                    </div>
                  )}
                  <div 
                    className="university-banner"
                    style={{ backgroundColor: universityColors[professor.university_name] || '#6b7280' }}
                  >
                    {professor.university_name === 'Drexel University' ? 'Drexel University' :
                     professor.university_name === 'University of Pennsylvania' ? 'Upenn' :
                     professor.university_name === 'Temple University' ? 'Temple University' :
                     professor.university_name === 'Thomas Jefferson University' ? 'Jefferson University' : 'Other'}
                  </div>
                  
                  <div className="professor-content">
                    <div className="professor-header">
                      <ProfilePhoto professor={professor} />
                      <div className="professor-info">
                        <h3 className="professor-name">{professor.name}</h3>
                        <p className="professor-position">Position: {professor.position}</p>
                        <p className="professor-department">Department: {professor.department_name}</p>
                      </div>
                    </div>

                    <div className="professor-metrics">
                      <div className="metric">
                        <span>Published this year:</span>
                        <span 
                          className="metric-indicator"
                          style={{ backgroundColor: professor.published_this_year === 'Yes' ? '#059669' : '#dc2626' }}
                        >
                          {professor.published_this_year}
                        </span>
                      </div>
                      <div className="metric">
                        <span>Published last year:</span>
                        <span 
                          className="metric-indicator"
                          style={{ backgroundColor: professor.published_last_year === 'Yes' ? '#059669' : '#dc2626' }}
                        >
                          {professor.published_last_year}
                        </span>
                      </div>
                      <div className="metric">
                        <span>Total number of papers:</span>
                        <span 
                          className="metric-indicator"
                          style={{ 
                            backgroundColor: professor.total_papers === 0 ? '#6b7280' :
                                          professor.total_papers >= 50 ? '#059669' : 
                                          professor.total_papers >= 20 ? '#eab308' : '#dc2626'
                          }}
                        >
                          {professor.total_papers}
                        </span>
                      </div>
                      <div className="metric">
                        <span>Average number published a year:</span>
                        <span 
                          className="metric-indicator"
                          style={{ 
                            backgroundColor: professor.avg_papers_per_year === 0 ? '#6b7280' :
                                          professor.avg_papers_per_year >= 5 ? '#059669' : 
                                          professor.avg_papers_per_year >= 2 ? '#eab308' : '#dc2626'
                          }}
                        >
                          {professor.avg_papers_per_year}
                        </span>
                      </div>
                    </div>

                    <div className="professor-actions">
                      <button 
                        className="action-button"
                        onClick={() => navigate(`/professor/${professor.id}`)}
                      >
                        View Publications
                      </button>
                      <button className="action-button">Contact</button>
                    </div>
                  </div>
                </div>
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