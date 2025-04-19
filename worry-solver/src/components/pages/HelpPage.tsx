import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faUser, 
  faClock, 
  faTag, 
  faChevronRight,
  faArrowLeft,
  faChevronLeft,
  faHandsHelping,
  faHome
} from '@fortawesome/free-solid-svg-icons';
import StorageSystem, { UserData } from '../../utils/StorageSystem';

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
  };
  
  // Handle filter button click
  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    // TODO: Implement filter logic
  };

  return (
    <main>
      <div className="hero hero-small" style={{
        padding: '60px 0',
        background: 'linear-gradient(135deg, #4f7cff 0%, #6a5acd 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <div className="container">
          <h1 className="hero-title" style={{
            fontSize: '2.5rem',
            marginBottom: '10px'
          }}>{t('helpTitle')}</h1>
          <p className="hero-subtitle" style={{
            fontSize: '1.1rem',
            opacity: 0.9
          }}>{t('helpSubtitle')}</p>
        </div>
      </div>

      <div className="container" style={{
        maxWidth: '900px',
        margin: '0 auto',
        marginTop: '-50px',
        marginBottom: '60px',
        position: 'relative',
        zIndex: 2
      }}>
        <Link to="/" className="back-link" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          color: 'var(--light-gray)',
          marginBottom: '20px',
          fontSize: '0.9rem'
        }}>
          <FontAwesomeIcon icon={faArrowLeft} /> {t('backToHome')}
        </Link>
      
      <div className="help-filters">
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
      </div>
      
      <div className="filter-bar" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'white',
          borderRadius: 'var(--border-radius)',
          padding: '15px 20px',
          marginBottom: '20px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div className="filter-options" style={{
            display: 'flex',
            gap: '10px'
          }}>
            {['全部', '最新提问', '等待回答', '热门话题'].map(filter => (
              <button
                key={filter}
                style={{
                  background: activeFilter === filter ? 'rgba(79, 124, 255, 0.1)' : 'none',
                  border: 'none',
                  fontSize: '0.9rem',
                  color: activeFilter === filter ? 'var(--primary-color)' : 'var(--light-gray)',
                  padding: '5px 10px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  fontWeight: activeFilter === filter ? '500' : 'normal'
                }}
                onClick={() => handleFilterClick(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="search-bar" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchPlaceholder')}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--lighter-gray)',
                borderRadius: '20px',
                fontSize: '0.9rem',
                width: '200px',
                transition: 'var(--transition)'
              }}
            />
            <button style={{
              background: 'none',
              border: 'none',
              color: 'var(--light-gray)',
              cursor: 'pointer',
              fontSize: '1rem'
            }}>
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </div>
        </div>

        <div className="topics-list" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {loading ? (
            <div className="loading-message">{t('loading')}</div>
          ) : filteredPosts.length === 0 ? (
            <div className="no-posts-message">{t('noPostsFound')}</div>
          ) : (
            filteredPosts.map((post) => (
              <div className="topic-card" key={post.accessCode} style={{
                backgroundColor: 'white',
                borderRadius: 'var(--border-radius)',
                padding: '20px',
                boxShadow: 'var(--card-shadow)',
                display: 'flex',
                gap: '15px',
                transition: 'var(--transition)'
              }}>
                <div className="topic-stats" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '70px',
                  paddingRight: '15px',
                  borderRight: '1px solid var(--lighter-gray)'
                }}>
                  <div className="stat-replies" style={{
                    textAlign: 'center',
                    padding: '5px 0'
                  }}>
                    <span className="stat-number" style={{
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      color: 'var(--text-color)',
                      display: 'block'
                    }}>0</span>
                    <span className="stat-label" style={{
                      fontSize: '0.8rem',
                      color: 'var(--light-gray)'
                    }}>{t('replies')}</span>
                  </div>
                  <div className="stat-views" style={{
                    textAlign: 'center',
                    padding: '5px 0'
                  }}>
                    <span className="stat-number" style={{
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      color: 'var(--text-color)',
                      display: 'block'
                    }}>0</span>
                    <span className="stat-label" style={{
                      fontSize: '0.8rem',
                      color: 'var(--light-gray)'
                    }}>{t('views')}</span>
                  </div>
                </div>
                
                <div className="topic-content" style={{ flex: 1 }}>
                  <div className="topic-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '10px'
                  }}>
                    <span className="topic-category" style={{
                      backgroundColor: 'rgba(79, 124, 255, 0.1)',
                      color: 'var(--primary-color)',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '500'
                    }}>
                      {post.selectedTags[0] || '其他'}
                    </span>
                    <span className="topic-time" style={{
                      color: 'var(--light-gray)',
                      fontSize: '0.85rem'
                    }}>
                      {getTimeAgo(post.timestamp)}
                    </span>
                  </div>
                  
                  <h3 className="topic-title" style={{
                    fontSize: '1.2rem',
                    marginBottom: '10px',
                    color: 'var(--text-color)'
                  }}>
                    <Link to={`/help/${post.accessCode}`} style={{
                      color: 'inherit',
                      textDecoration: 'none'
                    }}>
                      {post.confessionText.substring(0, 50)}...
                    </Link>
                  </h3>
                  
                  <p className="topic-excerpt" style={{
                    color: 'var(--light-gray)',
                    fontSize: '0.95rem',
                    marginBottom: '15px',
                    display: '-webkit-box',
                    WebkitLineClamp: '2',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {post.confessionText.length > 200 
                      ? `${post.confessionText.substring(0, 200)}...` 
                      : post.confessionText}
                  </p>
                  
                  <div className="topic-footer" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div className="topic-tags" style={{
                      display: 'flex',
                      gap: '5px'
                    }}>
                      {post.selectedTags.map((tag, index) => (
                        <span key={index} className="topic-tag" style={{
                          padding: '2px 8px',
                          backgroundColor: 'var(--lighter-gray)',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          color: 'var(--light-gray)'
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <Link to={`/help/${post.accessCode}`} className="topic-action" style={{
                      color: 'var(--primary-color)',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      {t('viewDetail')} <FontAwesomeIcon icon={faChevronRight} />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default HelpPage;
