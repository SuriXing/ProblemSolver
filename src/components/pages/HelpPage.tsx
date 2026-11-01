// Community help page — fetches posts with purpose='need_help'
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faEye,
  faComments,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
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
  const handleFilterChange = (filter: 'all' | 'newest' | 'solved') => {
    setActiveFilter(filter);
    setCurrentPage(1);
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
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage));

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
              <FontAwesomeIcon icon={faArrowLeft} /> {t('backToHome')}
            </button>
          </div>
        </div>

        <div className="search-filter-container">
          <div className="search-bar">
            <FontAwesomeIcon icon={faSearch} aria-hidden="true" />
            <input
              className="search-input"
              type="search"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <div className="filter-options">
            {(['all', 'newest', 'solved'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                className={`filter-button ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => handleFilterChange(filter)}
              >
                {filter === 'all' ? t('allPosts') : filter === 'newest' ? t('newest') : t('solved')}
              </button>
            ))}
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
            <button type="button" className="btn-primary-outline" onClick={fetchPosts} style={{ marginTop: 12 }}>
              {t('retryLoad')}
            </button>
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
              <div key={post.id} className="post-card">
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
                        <FontAwesomeIcon icon={faEye} /> {post.views || 0}
                      </span>
                      <span className="post-replies">
                        <FontAwesomeIcon icon={faComments} /> {post.replyCount ?? post.replies?.length ?? 0}
                      </span>
                      {(post.replyCount ?? post.replies?.length ?? 0) === 0 && (
                        <span className="no-reply-hint">{t('beFirstToReply')}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}

            <div className="pagination">
              <button
                type="button"
                className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`pagination-button ${page === currentPage ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                className={`pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HelpPage;