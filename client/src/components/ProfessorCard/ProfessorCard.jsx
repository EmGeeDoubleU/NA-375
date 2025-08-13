import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePhoto from '../ProfilePhoto/ProfilePhoto';
import './ProfessorCard.css';

const ProfessorCard = ({ professor, isTopResearcher, universityColors, onViewPublications }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (onViewPublications) {
      onViewPublications(professor.id);
    } else {
      navigate(`/professor/${professor.id}`);
    }
  };

  return (
    <div 
      className={`professor-card ${isTopResearcher(professor) ? 'top-researcher' : ''}`} 
      onClick={handleCardClick}
    >
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
      </div>
    </div>
  );
};

export default ProfessorCard; 