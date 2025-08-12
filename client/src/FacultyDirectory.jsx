import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch professors with full hierarchy data
      const professorsResponse = await fetch('http://localhost:5001/api/professors');
      const professorsData = await professorsResponse.json();
      
      // Fetch universities
      const universitiesResponse = await fetch('http://localhost:5001/api/universities');
      const universitiesData = await universitiesResponse.json();
      
      // Fetch departments
      const departmentsResponse = await fetch('http://localhost:5001/api/departments');
      const departmentsData = await departmentsResponse.json();
      
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

  const sortProfessors = (professorsToSort) => {
    return [...professorsToSort].sort((a, b) => {
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
          aValue = parseInt(a.total_papers) || 0;
          bValue = parseInt(b.total_papers) || 0;
          break;
        case 'avg_papers_per_year':
          aValue = parseFloat(a.avg_papers_per_year) || 0;
          bValue = parseFloat(b.avg_papers_per_year) || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  const filteredProfessors = professors.filter(professor => {
    const universityMatch = selectedUniversities.length === 0 || 
      selectedUniversities.includes(professor.university_name);
    const fieldMatch = selectedFields.length === 0 || 
      selectedFields.includes(professor.department_name);
    return universityMatch && fieldMatch;
  });

  const sortedProfessors = sortProfessors(filteredProfessors);

  if (loading) {
    return (
      <div className="faculty-directory">
        <div className="loading">Loading faculty directory...</div>
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
      {/* Filter Section */}
      <div className="filter-section">
        <h2 className="filter-title">Select the Universities of Interest</h2>
        <div className="university-filters">
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

        <h2 className="filter-title">Select Fields of Interest</h2>
        <div className="field-filters">
          <div className="field-row">
            {availableFields.slice(0, 6).map(field => (
              <button
                key={field}
                className={`filter-button ${selectedFields.includes(field) ? 'selected' : ''}`}
                onClick={() => toggleField(field)}
              >
                {field}
              </button>
            ))}
          </div>
          <div className="field-row">
            {availableFields.slice(6).map(field => (
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

        {/* Sort Section */}
        <div className="sort-section">
          <h2 className="filter-title">Sort By</h2>
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
      </div>

      {/* Professors Grid */}
      <div className="professors-grid">
        {sortedProfessors.map(professor => (
          <div key={professor.id} className="professor-card">
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
                    style={{ backgroundColor: getMetricColor(professor.published_this_year || 'No', 'published') }}
                  >
                    {professor.published_this_year || 'No'}
                  </span>
                </div>
                <div className="metric">
                  <span>Published last year:</span>
                  <span 
                    className="metric-indicator"
                    style={{ backgroundColor: getMetricColor(professor.published_last_year || 'No', 'published') }}
                  >
                    {professor.published_last_year || 'No'}
                  </span>
                </div>
                <div className="metric">
                  <span>Total number of papers:</span>
                  <span 
                    className="metric-indicator"
                    style={{ backgroundColor: getMetricColor(professor.total_papers || '0', 'total') }}
                  >
                    {professor.total_papers || '0'}
                  </span>
                </div>
                <div className="metric">
                  <span>Average number published a year:</span>
                  <span 
                    className="metric-indicator"
                    style={{ backgroundColor: getMetricColor(professor.avg_papers_per_year || '0', 'average') }}
                  >
                    {professor.avg_papers_per_year || '0'}
                  </span>
                </div>
              </div>

              <div className="professor-actions">
                <button 
                  className="action-button"
                  onClick={() => handleViewPublications(professor.id)}
                >
                  View Publications
                </button>
                <button className="action-button">Contact</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedProfessors.length === 0 && (
        <div className="no-results">
          No professors found matching your filters.
        </div>
      )}
    </div>
  );
};

export default FacultyDirectory; 