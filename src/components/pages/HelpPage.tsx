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
  const { t } = useTypeSafeTranslation(); // Only destructure what we need
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
      
      // Initialize view counts if they don't exist
      const postsWithCounts = allPosts.map(post => {
        const updatedPost = { ...post };
        
        // Initialize views if not present
        if (!updatedPost.views) {
          updatedPost.views = Math.floor(Math.random() * 90) + 10;
        }
        
        return updatedPost;
      });
      
      // Sort by timestamp (newest first)
      const sortedPosts = postsWithCounts.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      setPosts(sortedPosts);
      
      // Update the storage with the new counts
      const updatedStorage: Record<string, UserData> = {};
      postsWithCounts.forEach(post => {
        updatedStorage[post.accessCode] = post;
      });
      localStorage.setItem('problemSolver_userData', JSON.stringify(updatedStorage));
      
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
  
  // Handle post click to increment view count
  const handlePostClick = (post: UserData) => {
    // Increment view count
    const updatedPost = { ...post, views: (post.views || 0) + 1 };
    
    // Update storage
    const storage = JSON.parse(localStorage.getItem('problemSolver_userData') || '{}');
    storage[post.accessCode] = updatedPost;
    localStorage.setItem('problemSolver_userData', JSON.stringify(storage));
    
    // Update state
    setPosts(prevPosts => 
      prevPosts.map(p => p.accessCode === post.accessCode ? updatedPost : p)
    );
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
        <div className="page-header">
          <Link to="/" className="back-link">
            <ArrowLeftOutlined /> {t('returnHome')}
          </Link>
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
          {loading ? (
            <div className="loading-message">{t('loading')}</div>
          ) : currentPosts.length === 0 ? (
            <div className="no-posts-message">{t('noPostsFound')}</div>
          ) : (
            currentPosts.map((post) => (
              <Card 
                key={post.accessCode}
                className="topic-card"
                actions={[]}
              >
                <Card.Meta
                  title={
                    <Link 
                      to={`/help/${post.accessCode}`} 
                      onClick={() => handlePostClick(post)}
                    >
                      {post.confessionText.substring(0, 50)}...
                    </Link>
                  }
                  description={
                    <>
                      <div style={{ marginBottom: 8 }}>
                        <span className="topic-category">
                          {post.selectedTags[0] || '其他'}
                        </span>
                        <span className="topic-time" style={{ float: 'right' }}>
                          {getTimeAgo(post.timestamp)}
                        </span>
                      </div>
                      {/* Remove this paragraph to eliminate the duplicate text */}
                      {/* <p className="topic-excerpt">
                        {post.confessionText.length > 200 
                          ? `${post.confessionText.substring(0, 200)}...` 
                          : post.confessionText}
                      </p> */}
                      <div className="topic-tags">
                        {post.selectedTags.slice(0, 3).map(tag => (
                          <span key={tag} className="topic-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="topic-stats">
                        <span className="topic-stat">
                          <MessageOutlined /> {t('replies')}: {post.replies?.length || 0}
                        </span>
                        <span className="topic-stat">
                          <EyeOutlined /> {t('views')}: {post.views || 0}
                        </span>
                      </div>
                    </>
                  }
                />
              </Card>
            ))
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
};

export default HelpPage;
