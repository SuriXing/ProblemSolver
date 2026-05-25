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
import { useExitNavigate } from '../../context/NavigationLockContext';

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
  const { navigateWithExit } = useExitNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;
  const [helpItems, setHelpItems] = useState<Post[]>([]);

  // Get all available tags via i18n
  const tagKeys = ['anxiety', 'social', 'relationships', 'study', 'work', 'health', 'family', 'academic', 'school', 'other'] as const;

  // Get tags based on current language
  const getTags = () => {
    return tagKeys.map(key => i18nextT(`tag.${key}`, { defaultValue: key }));
  };

  // Load all posts from storage
  const fetchedRef = React.useRef(false);
  const fetchPosts = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('Loading took too long. Please check your connection and try again.');
    }, 10000);

    try {
      const posts = await DatabaseService.getPostsByPurpose('need_help');
      clearTimeout(timeoutId);
      setHelpItems(posts);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      console.error('Error fetching posts:', err);
      setError('Unable to load community posts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchPosts();
    }
  }, [fetchPosts]);

  // Force reload translations
  useEffect(() => {
    i18n.reloadResources();
  }, [i18n]);

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
    let matchesFilter = true;
    if (activeFilter === 'solved') {
      matchesFilter = post.status === 'solved';
    }
    // You can add more filter logic for 'newest' or others if needed
    return matchesSearch && matchesTag && matchesFilter;
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
      <div className="help-page-container page-fade-in">
        <div className="help-header">
          <h1>{t('helpPageTitle')}</h1>
          <p>{t('helpPageDescription')}</p>

          <div className="action-buttons">
            <button
              type="button"
              className="back-button"
              onClick={() => navigateWithExit('/')}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <Button type="default" icon={<ArrowLeftOutlined />}>
                {t('backToHome')}
              </Button>
            </button>
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
            <Button type="primary" onClick={fetchPosts} style={{ marginTop: 12 }}>
              {t('retryLoad')}
            </Button>
          </div>
        ) : helpItems.length === 0 ? (
          <div className="no-posts-container">
            <p>{t('helpEmptyState')}</p>
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
};

export default HelpPage;