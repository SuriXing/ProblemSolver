import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { 
  Input, 
  Card,
  Pagination,
  Radio,
  Button
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
import './HelpPage.css'; // Make sure this CSS file exists
import { useTranslation } from 'react-i18next';

// Helper function to get time ago
const getTimeAgo = (timestamp: string, t: (key: string, options?: any) => string): string => {
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
    return t('monthsAgo', { count: diffMonths });
  } else if (diffWeeks > 0) {
    return t('weeksAgo', { count: diffWeeks });
  } else if (diffDays > 0) {
    return t('daysAgo', { count: diffDays });
  } else if (diffHours > 0) {
    return t('hoursAgo', { count: diffHours });
  } else if (diffMins > 0) {
    return t('minutesAgo', { count: diffMins });
  } else {
    return t('justNow');
  }
};

const HelpPage: React.FC = () => {
  const { t, i18n } = useTypeSafeTranslation();
  const { t: i18nextT } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
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

  // Force reload translations
  useEffect(() => {
    i18n.reloadResources();
  }, [i18n]);

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
    
    // Handle filter change
    const handleFilterChange = (e: RadioChangeEvent) => {
      setActiveFilter(e.target.value);
    };
    
    // Filter posts by search term and tag
    const filteredPosts = helpItems.filter(post => {
      const matchesSearch = !searchTerm || 
        (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (post.user_id && post.user_id.includes(searchTerm));
        
      const matchesTag = !selectedTag || (post.tags && post.tags.includes(selectedTag));
      
      return matchesSearch && matchesTag;
    });
    
    // Pagination
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
    
    // Change page
    const handlePageChange = (page: number) => {
      setCurrentPage(page);
    };
    
    // Handle search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setCurrentPage(1); // Reset to first page when searching
    };
    
    return (
      <Layout>
        <div className="help-page-container">
          <div className="help-header">
            <h1>{t('helpPageTitle')}</h1>
            <p>{t('helpPageDescription')}</p>
            
            <div className="action-buttons">
              <Link to="/" className="back-button">
                <Button type="default" icon={<ArrowLeftOutlined />}>
                  {t('backToHome')}
                </Button>
              </Link>
              <Link to="/confession" className="new-post-button">
                <Button type="primary">
                  {t('createNewPost')}
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="search-filter-container">
            <div className="search-box">
              <Input 
                placeholder={t('searchPlaceholder')}
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <div className="filter-options">
              <Radio.Group value={activeFilter} onChange={handleFilterChange}>
                <Radio.Button value="all">{t('allPosts')}</Radio.Button>
                <Radio.Button value="newest">{t('newest')}</Radio.Button>
                <Radio.Button value="popular">{t('popular')}</Radio.Button>
                <Radio.Button value="solved">{t('solved')}</Radio.Button>
              </Radio.Group>
            </div>
          </div>
          
          <div className="tags-container">
            {getTags().map(tag => (
              <span 
                key={tag}
                className={`tag ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => handleTagClick(tag)}
              >
                {i18nextT(`tag.${tag}`, { defaultValue: tag })}
              </span>
            ))}
          </div>
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>{t('loadingPosts')}</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>{error}</p>
            </div>
          ) : currentPosts.length === 0 ? (
            <div className="no-posts-container">
              <p>{t('noPostsFound')}</p>
            </div>
          ) : (
            <div className="posts-container">
              {currentPosts.map(post => (
                <Card key={post.id} className="post-card">
                  <Link to={`/help/${post.access_code}`} className="post-link">
                    <div className="post-content">
                      <div className="post-text">{post.content}</div>
                      <div className="post-meta">
                        <span className="post-time">{getTimeAgo(post.created_at, t)}</span>
                      </div>
                      <div className="post-tags">
                        {post.tags && post.tags.map(tag => (
                          <span key={tag} className="post-tag">{i18nextT(`tag.${tag}`, { defaultValue: tag })}</span>
                        ))}
                      </div>
                      <div className="post-stats">
                        <span className="post-views">
                          <EyeOutlined /> {post.views || 0}
                        </span>
                        <span className="post-replies">
                          <MessageOutlined /> {post.replies?.length || 0}
                        </span>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
              
              <Pagination
                current={currentPage}
                pageSize={postsPerPage}
                total={filteredPosts.length}
                onChange={handlePageChange}
                showSizeChanger={false}
                className="pagination"
              />
            </div>
          )}
        </div>
      </Layout>
    );
  } catch (error) {
    console.error('Render error:', error);
    setRenderError(error as Error);
    
    return (
      <Layout>
        <div className="error-container">
          <h2>{t('errorOccurred')}</h2>
          <p>{renderError?.message || t('unknownError')}</p>
        </div>
      </Layout>
    );
  }
};

export default HelpPage;