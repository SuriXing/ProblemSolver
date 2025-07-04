import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { 
  Input, 
  Card,
  Pagination,
  Radio
} from 'antd';
import type { RadioChangeEvent } from 'antd/es/radio';
import { 
  EyeOutlined,
  MessageOutlined,
  ArrowLeftOutlined,
  SearchOutlined
} from '@ant-design/icons';
import Layout from '../layout/Layout';
import { Post } from '../../types/database.types';
import { DatabaseService } from '../../services/database.service';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('全部');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;
  const [renderError, setRenderError] = useState<Error | null>(null);
  const [helpItems, setHelpItems] = useState<Post[]>([]);

  // Get all available tags
  const availableTags = {
    'zh-CN': ['焦虑', '社交', '人际关系', '学习', '工作', '健康', '家庭', '感情', '其他'],
    'en': ['Anxiety', 'Social', 'Relationships', 'Study', 'Work', 'Health', 'Family', 'Love', 'Other']
  };
  
  // Get tags based on current language
  const getTags = () => {
    const currentLang = localStorage.getItem('language') || 'zh-CN';
    const tags = availableTags[currentLang as keyof typeof availableTags] || availableTags['en'];
    return tags || []; // Ensure we always return an array
  };

  // Load all posts from storage
  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const posts = await DatabaseService.getPostsByPurpose('need_help');
        setHelpItems(posts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPosts();
  }, []);

  try {
    // Handle tag click
    const handleTagClick = (tag: string) => {
      if (selectedTag === tag) {
        setSelectedTag(null); // Deselect if already selected
      } else {
        setSelectedTag(tag);
      }
      setCurrentPage(1); // Reset to first page
    };
    
    // Handle filter click
    const handleFilterClick = (filter: string) => {
      setActiveFilter(filter);
      // Implement filtering logic here
      // For now, just update the UI
    };
    
    // Filter posts by search term and tag
    const filteredPosts = helpItems.filter(post => {
      const matchesSearch = !searchTerm || 
        (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (post.user_id && post.user_id.includes(searchTerm));
        
      const matchesTag = !selectedTag || (post.tags && post.tags.includes(selectedTag));
      
      return matchesSearch && matchesTag;
    });
    
    // Calculate pagination
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
    
    // Handle pagination
    const paginate = (pageNumber: number) => {
      setCurrentPage(pageNumber);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    // Handle post click - increment view count
    const handlePostClick = async (post: Post) => {
      if (!post.id) {
        console.error("Post has no ID:", post);
        return;
      }
      
      try {
        await DatabaseService.incrementViewCount(post.id);
      } catch (error) {
        console.error('Error incrementing view count:', error);
      }
    };

    if (loading) {
      return (
        <Layout>
          <div className="container help-container">
            <div className="loading-message">{t('loading')}</div>
          </div>
        </Layout>
      );
    }

    if (error) {
      return (
        <Layout>
          <div className="container help-container">
            <div className="error-message">{error}</div>
            <Link to="/" className="back-link">
              <ArrowLeftOutlined /> {t('returnHome')}
            </Link>
          </div>
        </Layout>
      );
    }

    if (renderError) {
      return (
        <Layout>
          <div className="container help-container">
            <div className="error-message">
              <h2>Rendering Error</h2>
              <p>{renderError.message}</p>
              <pre>{renderError.stack}</pre>
            </div>
            <Link to="/" className="back-link">
              <ArrowLeftOutlined /> {t('returnHome')}
            </Link>
          </div>
        </Layout>
      );
    }

    return (
      <Layout>
        <div className="container help-container">
          <div className="page-header">
            <Link to="/" className="back-link">
              <ArrowLeftOutlined /> {t('returnHome')}
            </Link>
            <button 
              onClick={() => {
                localStorage.removeItem('problemSolver_userData');
                console.log('localStorage posts cleared');
                window.location.reload(); // Reload the page to reflect changes
              }}
              style={{
                marginLeft: '20px',
                padding: '5px 10px',
                background: '#ff4d4f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear All Posts
            </button>
            <button 
              onClick={() => {
                const data = localStorage.getItem('problemSolver_userData');
                console.log('Current localStorage data:', data);
                try {
                  const parsed = JSON.parse(data || '{}');
                  console.log('Parsed data:', parsed);
                } catch (e) {
                  console.error('Error parsing data:', e);
                }
              }}
              style={{
                marginLeft: '10px',
                padding: '5px 10px',
                background: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Debug Data
            </button>
            <button 
              onClick={() => {
                // Create a test post
                const testPost = {
                  userId: "1234",
                  accessCode: "test" + Date.now(),
                  confessionText: "This is a test post created at " + new Date().toLocaleString(),
                  selectedTags: ["焦虑", "学习"],
                  privacyOption: "public",
                  emailNotification: false,
                  email: "",
                  timestamp: new Date().toISOString(),
                  replies: [],
                  views: 0
                };
                
                // Get current data
                let storage = [];
                try {
                  const existingData = localStorage.getItem('problemSolver_userData');
                  if (existingData) {
                    const parsed = JSON.parse(existingData);
                    storage = Array.isArray(parsed) ? parsed : [];
                  }
                } catch (e) {
                  console.error('Error parsing existing data, starting fresh', e);
                  storage = [];
                }
                
                // Add test post
                storage.push(testPost);
                
                // Save back to localStorage
                localStorage.setItem('problemSolver_userData', JSON.stringify(storage));
                console.log('Test post created:', testPost);
                console.log('Current localStorage after test post:', localStorage.getItem('problemSolver_userData'));
                
                // Reload the page
                window.location.reload();
              }}
              style={{
                marginLeft: '10px',
                padding: '5px 10px',
                background: '#52c41a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create Test Post
            </button>
          </div>
        
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
            <Radio.Group 
              value={activeFilter}
              onChange={(e: RadioChangeEvent) => handleFilterClick(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              {['全部', '最新提问', '等待回答', '热门话题'].map(filter => (
                <Radio.Button key={filter} value={filter}>
                  {filter}
                </Radio.Button>
              ))}
            </Radio.Group>
            <Input.Search
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              style={{ width: 200 }}
              enterButton={<SearchOutlined />}
            />
          </div>

          <div className="topics-list">
            {currentPosts.length === 0 ? (
              <div className="no-posts-message">{t('noPostsFound')}</div>
            ) : (
              currentPosts.map((post) => {
                // Add defensive checks for each post
                if (!post) return null;
                
                return (
                  <Card 
                    key={post.access_code || post.id || 'unknown'}
                    className="topic-card"
                    actions={[]}
                  >
                    <Card.Meta
                      title={
                        post.access_code ? (
                          <Link 
                            to={`/help/${post.access_code}`} 
                            onClick={() => handlePostClick(post)}
                          >
                            {post.content && post.content.length > 50 
                              ? `${post.content.substring(0, 50)}...` 
                              : post.content || 'No text'}
                          </Link>
                        ) : (
                          <span>
                            {post.content && post.content.length > 50 
                              ? `${post.content.substring(0, 50)}...` 
                              : post.content || 'No text'}
                          </span>
                        )
                      }
                      description={
                        <>
                          <div style={{ marginBottom: 8 }}>
                            <span className="topic-category">
                              {post.tags && post.tags.length > 0 ? post.tags[0] : '其他'}
                            </span>
                            <span className="topic-time" style={{ float: 'right' }}>
                              {post.created_at ? getTimeAgo(post.created_at) : 'Unknown time'}
                            </span>
                          </div>
                          <div className="topic-tags">
                            {post.tags && post.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="topic-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="topic-stats">
                            <span className="topic-stat">
                              <MessageOutlined /> {t('replies')}: {post.replies ? post.replies.length : 0}
                            </span>
                            <span className="topic-stat">
                              <EyeOutlined /> {t('views')}: {post.views || 0}
                            </span>
                          </div>
                        </>
                      }
                    />
                  </Card>
                );
              })
            )}
          </div>
          
          {filteredPosts.length > postsPerPage && (
            <Pagination
              current={currentPage}
              total={filteredPosts.length}
              pageSize={postsPerPage}
              onChange={paginate}
              showSizeChanger={false}
              style={{ marginTop: 30, textAlign: 'center' }}
            />
          )}
        </div>
      </Layout>
    );
  } catch (error) {
    console.error("Error rendering HelpPage:", error);
    setRenderError(error as Error);
    
    return (
      <Layout>
        <div className="container help-container">
          <div className="error-message">
            <h2>Rendering Error</h2>
            <p>{(error as Error).message}</p>
          </div>
          <Link to="/" className="back-link">
            <ArrowLeftOutlined /> {t('returnHome')}
          </Link>
        </div>
      </Layout>
    );
  }
};

export default HelpPage;
