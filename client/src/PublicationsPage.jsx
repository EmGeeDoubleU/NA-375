import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProfilePhoto from './components/ProfilePhoto/ProfilePhoto';
import Layout from './components/Layout/Layout';
import { getInitials, isTopResearcher } from './utils/facultyUtils';
import './PublicationsPage.css';

const PublicationsPage = () => {
  const { professorId } = useParams();
  const navigate = useNavigate();
  const [professor, setProfessor] = useState(null);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, hasMore: true });
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    fetchProfessorData();
  }, [professorId]);

  // Add scroll listener for back to top button and infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
      
      // Infinite scroll: load more publications when near bottom
      if (pagination.hasMore && !loadingMore) {
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        if (scrollPosition >= documentHeight - 100) {
          loadMorePublications();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pagination.hasMore, loadingMore]);

  const fetchProfessorData = async () => {
    try {
      setLoading(true);
      
      // Fetch professor details and first page of publications concurrently
      const [professorResponse, publicationsResponse] = await Promise.all([
        fetch(`http://localhost:5001/api/professors/${professorId}`),
        fetch(`http://localhost:5001/api/articles/professor/${professorId}?page=1&limit=20`)
      ]);
      
      const [professorData, publicationsData] = await Promise.all([
        professorResponse.json(),
        publicationsResponse.json()
      ]);
      
      setProfessor(professorData);
      // Extract articles array from the paginated response
      setPublications(publicationsData.articles || publicationsData);
      setPagination({
        page: publicationsData.pagination?.page || 1,
        hasMore: publicationsData.pagination?.hasMore || false
      });
      
    } catch (err) {
      setError('Failed to fetch professor data');
      console.error('Error fetching professor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePublications = async () => {
    if (loadingMore || !pagination.hasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = pagination.page + 1;
      
      const response = await fetch(
        `http://localhost:5001/api/articles/professor/${professorId}?page=${nextPage}&limit=20`
      );
      const data = await response.json();
      
      if (data.articles && data.articles.length > 0) {
        setPublications(prev => [...prev, ...data.articles]);
        setPagination({
          page: data.pagination.page,
          hasMore: data.pagination.hasMore
        });
      }
    } catch (err) {
      console.error('Error loading more publications:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading professor publications...</div>
        </div>
      </Layout>
    );
  }

  if (error || !professor) {
    return (
      <Layout>
        <div className="error">Error: {error || 'Professor not found'}</div>
        <button className="back-button" onClick={handleBackClick}>Back to Directory</button>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Back to top button */}
      {showBackToTop && (
        <button className="back-to-top-button" onClick={scrollToTop}>
          ↑
        </button>
      )}

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
          <ProfilePhoto professor={professor} className="profile-avatar" />
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
        
        {/* Loading more indicator */}
        {loadingMore && (
          <div className="loading-more">
            <div className="loading-spinner"></div>
            <p>Loading more publications...</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PublicationsPage; 