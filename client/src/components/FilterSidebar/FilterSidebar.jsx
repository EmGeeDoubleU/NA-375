import React from 'react';
import './FilterSidebar.css';

const FilterSidebar = ({ 
  universities, 
  selectedUniversities, 
  toggleUniversity, 
  availableFields, 
  selectedFields, 
  toggleField,
  isOpen = true
}) => {
  return (
    <div className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="sidebar-content">
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
  );
};

export default FilterSidebar; 