import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faEye,
  faComments,
  faChevronRight,
  faArrowLeft,
  faChevronLeft,
  faStepBackward,
  faStepForward
} from '@fortawesome/free-solid-svg-icons';
import { UserData } from '../../utils/StorageSystem';
import Layout from '../layout/Layout';
import '../../styles/HelpPage.css'; // Import CSS file instead of CSS modules

// Helper function to get time ago
const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  if (diffMonths > 0) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  } else if (diffWeeks > 0) {
    return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
  } else if (diffDays > 0) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else if (diffHours > 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffMins > 0) {
    return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
  } else {
    return 'Just now';
  }
};

const HelpPage: React.FC = () => {
  const { t } = useTypeSafeTranslation();
  const [posts, setPosts] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('全部');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;
  
  // Get all available tags
  const availableTags = {
    'zh-CN': ['焦虑', '社交', '人际关系', '学习', '工作', '健康', '家庭', '感情', '其他'],
    'en': ['Anxiety', 'Social', 'Relationships', 'Study', 'Work', 'Health', 'Family', 'Love', 'Other']
  };
  
  // Get tags based on current language
  const getTags = () => {
    const currentLang = localStorage.getItem('language') || 'zh-CN';
    return availableTags[currentLang as keyof typeof availableTags] || availableTags['en'];
  };
  
  // Filter posts by search term and tag
  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchTerm || 
      post.confessionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.userId.includes(searchTerm);
      
    const matchesTag = !selectedTag || post.selectedTags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });
  
  // Calculate pagination
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  
  // Load all posts from storage
  useEffect(() => {
    setLoading(true);
    
    // Get all data from storage
    try {
      const storage = JSON.parse(localStorage.getItem('problemSolver_userData') || '{}');
      const allPosts = Object.values(storage) as UserData[];
      
      // Sort by timestamp (newest first)
      const sortedPosts = allPosts.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      setPosts(sortedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    }
    
    setLoading(false);
  }, []);
  
  // Handle tag filter click
  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  // Handle filter button click
  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
    // TODO: Implement filter logic
  };
  
  // Handle pagination
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top when changing page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout>
      <div className="hero hero-small">
        <div className="container">
          <h1 className="hero-title">{t('helpTitle')}</h1>
          <p className="hero-subtitle">{t('helpSubtitle')}</p>
        </div>
      </div>

      <div className="container help-container">
        <Link to="/" className="back-link">
          <FontAwesomeIcon icon={faArrowLeft} /> {t('returnHome')}
        </Link>
      
        <div className="tag-filters">
          {getTags().map(tag => (
            <span
              key={tag}
              className={`tag ${selectedTag === tag ? 'selected' : ''}`}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </span>
          ))}
        </div>
      
        <div className="filter-bar">
          <div className="filter-options">
            {['全部', '最新提问', '等待回答', '热门话题'].map(filter => (
              <button
                key={filter}
                className={`filter-button ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => handleFilterClick(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="search-bar">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="search-input"
            />
            <button className="search-button">
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </div>
        </div>

        <div className="topics-list">
          {loading ? (
            <div className="loading-message">{t('loading')}</div>
          ) : currentPosts.length === 0 ? (
            <div className="no-posts-message">{t('noPostsFound')}</div>
          ) : (
            currentPosts.map((post) => (
              <div className="topic-card" key={post.accessCode}>
                <div className="topic-stats">
                  <div className="stat-replies">
                    <span className="stat-number">0</span>
                    <span className="stat-label">
                      <FontAwesomeIcon icon={faComments} style={{ marginRight: '4px' }} />
                      {t('replies')}
                    </span>
                  </div>
                  <div className="stat-views">
                    <span className="stat-number">0</span>
                    <span className="stat-label">
                      <FontAwesomeIcon icon={faEye} style={{ marginRight: '4px' }} />
                      {t('views')}
                    </span>
                  </div>
                </div>
                
                <div className="topic-content">
                  <div className="topic-header">
                    <span className="topic-category">
                      {post.selectedTags[0] || '其他'}
                    </span>
                    <span className="topic-time">
                      {getTimeAgo(post.timestamp)}
                    </span>
                  </div>
                  
                  <h3 className="topic-title">
                    <Link to={`/help/${post.accessCode}`} className="topic-title-link">
                      {post.confessionText.substring(0, 50)}...
                    </Link>
                  </h3>
                  
                  <p className="topic-excerpt">
                    {post.confessionText.length > 200 
                      ? `${post.confessionText.substring(0, 200)}...` 
                      : post.confessionText}
                  </p>
                  
                  <div className="topic-footer">
                    <div className="topic-tags">
                      {post.selectedTags.slice(0, 3).map(tag => (
                        <span key={tag} className="topic-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link to={`/help/${post.accessCode}`} className="topic-action">
                      {t('viewDetail')} <FontAwesomeIcon icon={faChevronRight} />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {filteredPosts.length > postsPerPage && (
          <div className="pagination">
            <button 
              onClick={() => paginate(1)} 
              disabled={currentPage === 1}
              className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
            >
              <FontAwesomeIcon icon={faStepBackward} />
            </button>
            <button 
              onClick={() => paginate(currentPage - 1)} 
              disabled={currentPage === 1}
              className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
              let pageNumber: number;
              if (totalPages <= 5) {
                pageNumber = index + 1;
              } else if (currentPage <= 3) {
                pageNumber = index + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + index;
              } else {
                pageNumber = currentPage - 2 + index;
              }
              
              return (
                <button 
                  key={pageNumber}
                  onClick={() => paginate(pageNumber)}
                  className={`pagination-button ${currentPage === pageNumber ? 'active' : ''}`}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            <button 
              onClick={() => paginate(currentPage + 1)} 
              disabled={currentPage === totalPages}
              className={`pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
            <button 
              onClick={() => paginate(totalPages)} 
              disabled={currentPage === totalPages}
              className={`pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
            >
              <FontAwesomeIcon icon={faStepForward} />
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HelpPage;
