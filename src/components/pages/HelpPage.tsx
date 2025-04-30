import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { 
  Input, 
  Card,
  Pagination,
} from 'antd';
import { 
  EyeOutlined,
  MessageOutlined,
  ArrowLeftOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { UserData } from '../../utils/StorageSystem';
import Layout from '../layout/Layout';
import StorageSystem from '../../utils/StorageSystem';
import '../../styles/HelpPage.css';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;
  const [renderError, setRenderError] = useState<Error | null>(null);

  // Load all posts from storage
  useEffect(() => {
    setLoading(true);
    
    const fetchData = async () => {
      try {
        const allPosts = await StorageSystem.getAllData();
        console.log("Fetched posts:", allPosts); // Debug log
        
        if (Array.isArray(allPosts)) {
          // Initialize view counts to 0 if they don't exist
          const postsWithCounts = allPosts.map((post: any) => {
            const updatedPost = { ...post };
            
            // Initialize views to 0 if not present
            if (updatedPost.views === undefined) {
              updatedPost.views = 0;
            }
            
            return updatedPost;
          });
          
          // Sort by timestamp (newest first)
          const sortedPosts = postsWithCounts.sort((a: any, b: any) => {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          });
          
          setPosts(sortedPosts);
          console.log("Posts after sorting:", sortedPosts);
        } else {
          console.log("Posts is not an array, setting to empty array"); // Debug log
          setPosts([]);
        }
      } catch (error) {
        console.error('Error loading posts:', error);
        setError('Failed to load posts. Please try again later.');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  try {
    // Filter posts by search term
    const filteredPosts = posts.filter(post => {
      return !searchTerm || 
        post.confessionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.userId.includes(searchTerm);
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
    const handlePostClick = async (post: UserData) => {
      if (!post.accessCode) {
        console.error("Post has no accessCode:", post);
        return;
      }
      
      try {
        await StorageSystem.incrementViewCount(post.accessCode);
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
          </div>
          
          <div className="filter-bar">
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
                    key={post.accessCode || 'unknown'}
                    className="topic-card"
                    actions={[]}
                  >
                    <Card.Meta
                      title={
                        post.accessCode ? (
                          <Link 
                            to={`/help/${post.accessCode}`} 
                            onClick={() => handlePostClick(post)}
                          >
                            {post.confessionText && post.confessionText.length > 50 
                              ? `${post.confessionText.substring(0, 50)}...` 
                              : post.confessionText || 'No text'}
                          </Link>
                        ) : (
                          <span>
                            {post.confessionText && post.confessionText.length > 50 
                              ? `${post.confessionText.substring(0, 50)}...` 
                              : post.confessionText || 'No text'}
                          </span>
                        )
                      }
                      description={
                        <>
                          <div style={{ marginBottom: 8 }}>
                            <span className="topic-time" style={{ float: 'right' }}>
                              {post.timestamp ? getTimeAgo(post.timestamp) : 'Unknown time'}
                            </span>
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
