import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PublicationsPage.css';

const PublicationsPage = () => {
  const { professorId } = useParams();
  const navigate = useNavigate();
  const [professor, setProfessor] = useState(null);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <div className="profile-avatar-initials">
          {getInitials(professor.name)}
        </div>
      );
    }
    
    // Try to load the image, fallback to initials on error
    return (
      <img 
        src={professor.headshot} 
        alt={professor.name}
        className="profile-avatar"
        onError={() => setImageError(true)}
      />
    );
  };

  // Determine if a professor is a top researcher
  const isTopResearcher = (professor) => {
    return professor.total_papers >= 300 && 
           (professor.published_this_year === 'Yes' || professor.published_last_year === 'Yes') &&
           professor.avg_papers_per_year >= 6;
  };

  useEffect(() => {
    fetchProfessorData();
  }, [professorId]);

  const fetchProfessorData = async () => {
    try {
      setLoading(true);
      
      // Fetch professor details and publications concurrently
      const [professorResponse, publicationsResponse] = await Promise.all([
        fetch(`http://localhost:5001/api/professors/${professorId}`),
        fetch(`http://localhost:5001/api/articles/professor/${professorId}`)
      ]);
      
      const [professorData, publicationsData] = await Promise.all([
        professorResponse.json(),
        publicationsResponse.json()
      ]);
      
      setProfessor(professorData);
      setPublications(publicationsData);
      
    } catch (err) {
      setError('Failed to fetch professor data');
      console.error('Error fetching professor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="publications-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading professor publications...</div>
        </div>
      </div>
    );
  }

  if (error || !professor) {
    return (
      <div className="publications-page">
        <div className="error">Error: {error || 'Professor not found'}</div>
        <button className="back-button" onClick={handleBackClick}>Back to Directory</button>
      </div>
    );
  }

  return (
    <div className="publications-page">
      {/* Header with back button */}
      <div className="page-header">
        <button className="back-button" onClick={handleBackClick}>
          ← Back to Directory
        </button>
      </div>

      {/* Professor Profile Section */}
      <div className="professor-profile">
        <div className={`profile-header ${isTopResearcher(professor) ? 'top-researcher' : ''}`}>
          {isTopResearcher(professor) && (
            <div className="top-researcher-badge">
              🔥 Top Researcher
            </div>
          )}
          <ProfilePhoto professor={professor} />
          <div className="profile-info">
            <h1 className="profile-name">{professor.name}</h1>
            <p className="profile-position">{professor.position}</p>
            <p className="profile-department">{professor.department_name}</p>
            <p className="profile-university">{professor.university_name}</p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="contact-section">
          <h2>Contact Information</h2>
          <div className="contact-grid">
            <div className="contact-item">
              <span className="contact-label">Email:</span>
              <span className="contact-value">
                {professor.email !== 'N/A' ? (
                  <a href={`mailto:${professor.email}`}>{professor.email}</a>
                ) : (
                  'Not available'
                )}
              </span>
            </div>
            <div className="contact-item">
              <span className="contact-label">Phone:</span>
              <span className="contact-value">
                {professor.phone !== 'N/A' ? (
                  <a href={`tel:${professor.phone}`}>{professor.phone}</a>
                ) : (
                  'Not available'
                )}
              </span>
            </div>
            {professor.google_scholar_link && professor.google_scholar_link !== 'N/A' && (
              <div className="contact-item">
                <span className="contact-label">Google Scholar:</span>
                <span className="contact-value">
                  <a 
                    href={professor.google_scholar_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="scholar-link"
                  >
                    View Profile
                  </a>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Publication Metrics */}
        <div className="metrics-section">
          <h2>Publication Metrics</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-value">{professor.total_papers}</span>
              <span className="metric-label">Total Publications</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">{professor.published_this_year}</span>
              <span className="metric-label">Published This Year</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">{professor.published_last_year}</span>
              <span className="metric-label">Published Last Year</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">{professor.avg_papers_per_year}</span>
              <span className="metric-label">Avg. Per Year</span>
            </div>
          </div>
        </div>
      </div>

      {/* Publications List */}
      <div className="publications-section">
        <h2>Publications ({professor.total_papers})</h2>
        {publications.length > 0 ? (
          <div className="publications-list">
            {publications.map((publication, index) => (
              <div key={publication.id || index} className="publication-item">
                <div className="publication-content">
                  <h3 className="publication-title">
                    {publication.article_link && publication.article_link !== 'N/A' ? (
                      <a 
                        href={publication.article_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="publication-link"
                      >
                        {publication.title}
                      </a>
                    ) : (
                      publication.title
                    )}
                  </h3>
                  <p className="publication-authors">{publication.authors || 'Authors not available'}</p>
                  <p className="publication-venue">{publication.venue || 'Venue not available'}</p>
                  <p className="publication-year">Published: {publication.publication_year || 'Year not available'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-publications">
            <p>No publications found for this professor.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicationsPage; 