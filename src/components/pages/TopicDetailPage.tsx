import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faHeart, 
  faShareSquare, 
  faArrowLeft,
  faComments
} from '@fortawesome/free-solid-svg-icons';
import styles from './TopicDetailPage.module.css';

// Mock data for topic details
const topicDetails = {
  '1': {
    id: '1',
    title: "感觉工作压力太大，无法平衡生活，该怎么办？",
    category: "工作/学业",
    time: "2小时前",
    views: 42,
    content: `
      <p>最近工作压力非常大，每天加班到很晚，有时候甚至通宵加班。我在一家互联网公司工作，负责的项目非常紧急，每天都有解不完的bug和做不完的需求。</p>
      <p>我感觉自己的生活完全被工作占据了，没有时间陪家人，没有时间做自己喜欢的事情，甚至连基本的休息都无法保证。周末本应该休息，但总是惦记着工作的事情，要么加班，要么就是焦虑地想着周一又有一堆事情等着我。</p>
      <p>我曾经尝试过和主管沟通，但得到的回应是"这个阶段大家都很忙"，"坚持一下，项目上线后就好了"，但项目上线后又会有新的项目，感觉这是一个无限循环。</p>
      <p>我开始怀疑自己是不是不适合这个行业，或者是不是自己的能力不足导致效率低下。但每天加班这么久，已经尽力了，实在不知道还能怎么提高效率。</p>
      <p>我该如何平衡工作和生活？有什么方法可以减轻压力，找回生活的乐趣？还是说这个行业就是这样，必须接受？</p>
    `,
    tags: ["压力", "工作", "生活平衡"]
  },
  '2': {
    id: '2',
    title: "如何克服社交恐惧，学会与人正常交流？",
    category: "人际关系",
    time: "1天前",
    views: 86,
    content: `
      <p>我从小就比较内向，但最近几年感觉自己的社交恐惧越来越严重。每次需要与陌生人交流，我就会感到极度焦虑，心跳加速，手心出汗，甚至说话结巴。</p>
      <p>在公司开会时，我几乎从不敢发言，即使我有很好的想法。和同事一起吃饭我也会感到不自在，不知道该说什么，常常是别人在聊天，我只是附和着笑笑。</p>
      <p>我意识到这个问题严重影响了我的工作和生活质量。工作上错过了很多展示自己的机会，生活中也很难交到新朋友，感觉越来越孤独。</p>
      <p>我尝试过逼自己多参加社交活动，但每次都是非常痛苦的经历，回家后会懊恼自己表现得多么糟糕。</p>
      <p>有谁遇到过类似的情况吗？你是如何克服的？有什么方法或技巧可以帮助我减轻社交焦虑，学会自然地与人交流？</p>
    `,
    tags: ["社交恐惧", "焦虑", "人际关系"]
  }
};

// Mock data for replies
const replies = {
  '1': [
    {
      id: '1',
      username: "平衡达人",
      time: "1小时前",
      content: "我理解你的处境，互联网行业确实普遍加班严重。建议尝试这几点：1. 设定清晰边界，下班后关闭工作通知；2. 高效工作时间，减少无效会议；3. 与主管建设性沟通，提出具体问题和解决方案；4. 每天留出'我的时间'，哪怕只有30分钟；5. 周末至少确保一天完全不碰工作。最重要的是，记住工作只是生活的一部分，不是全部。",
      likes: 12
    },
    {
      id: '2',
      username: "前重度工作狂",
      time: "50分钟前",
      content: "我曾经也是24/7工作，直到身体亮起红灯。现在学会了委派和说不。技巧：使用番茄工作法提高专注度；学会拒绝不必要的任务；培养工作外的爱好，强制自己离开工作环境。记住，公司倒了会立刻换人，但你的健康和家庭无可替代。试着调整心态，不再把个人价值完全绑定在工作成就上。",
      likes: 8
    }
  ],
  '2': [
    {
      id: '1',
      username: "曾经恐社交",
      time: "10小时前",
      content: "我也曾有严重的社交恐惧，通过认知行为疗法有了很大改善。可以从小的社交互动开始，逐步提升难度。出现焦虑时，深呼吸，告诉自己这只是暂时的感觉，会过去的。建议寻求专业心理医生的帮助，这不是软弱，而是勇敢面对问题的表现。加油！",
      likes: 15
    }
  ]
};

const TopicDetailPage: React.FC = () => {
  const { t } = useTypeSafeTranslation();
  const { topicId } = useParams<{ topicId: string }>();
  const [topic, setTopic] = useState<any>(null);
  const [topicReplies, setTopicReplies] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('latest');
  
  useEffect(() => {
    // Simulate data fetching
    setTimeout(() => {
      if (topicId && topicDetails[topicId as keyof typeof topicDetails]) {
        setTopic(topicDetails[topicId as keyof typeof topicDetails]);
        setTopicReplies(replies[topicId as keyof typeof replies] || []);
      }
      setIsLoading(false);
    }, 800);
  }, [topicId]);
  
  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyText.trim()) return;
    
    // Generate a random username
    const username = `Helper${Math.floor(Math.random() * 10000)}`;
    
    // Create new reply
    const newReply = {
      id: Date.now().toString(),
      username,
      time: t('justNow'),
      content: replyText,
      likes: 0
    };
    
    // Update state
    setTopicReplies([newReply, ...topicReplies]);
    setReplyText('');
    
    // Show success message or scroll to replies
    const repliesSection = document.getElementById('repliesSection');
    if (repliesSection) {
      repliesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const handleSortChange = (order: string) => {
    setSortOrder(order);
    
    // Sort replies
    let sortedReplies = [...topicReplies];
    if (order === 'oldest') {
      sortedReplies.reverse();
    } else if (order === 'helpful') {
      sortedReplies.sort((a, b) => b.likes - a.likes);
    }
    
    setTopicReplies(sortedReplies);
  };
  
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>{t('loading')}</p>
      </div>
    );
  }
  
  if (!topic) {
    return (
      <div className={styles.errorContainer}>
        <h2>{t('topicNotFound')}</h2>
        <p>{t('topicMayNotExist')}</p>
        <Link to="/" className={styles.returnHomeLink}>
          <FontAwesomeIcon icon={faArrowLeft} /> 
          <span>{t('returnHome')}</span>
        </Link>
      </div>
    );
  }
  
  return (
    <div className={styles.topicDetailContainer}>
      <div className={styles.navigationBar}>
        <Link to="/help" className={styles.backLink}>
          <FontAwesomeIcon icon={faArrowLeft} /> 
          <span>{t('backToTopics')}</span>
        </Link>
      </div>
      
      <div className={styles.topicDetail}>
        <div className={styles.topicHeader}>
          <div className={styles.topicMeta}>
            <span className={styles.topicCategory}>{topic.category}</span>
            <span className={styles.topicTime}>{topic.time}</span>
          </div>
          <div className={styles.topicViews}>
            <FontAwesomeIcon icon={faEye} />
            <span>{topic.views} {t('views')}</span>
          </div>
        </div>
        
        <h2 className={styles.topicTitle}>{topic.title}</h2>
        
        <div 
          className={styles.topicContent}
          dangerouslySetInnerHTML={{ __html: topic.content }}
        />
        
        <div className={styles.topicFooter}>
          <div className={styles.topicTags}>
            {topic.tags.map((tag: string, index: number) => (
              <span key={index} className={styles.topicTag}>{tag}</span>
            ))}
          </div>
          <div className={styles.topicActions}>
            <button className={styles.topicAction}>
              <FontAwesomeIcon icon={faHeart} /> 
              <span>{t('favorite')}</span>
            </button>
            <button className={styles.topicAction}>
              <FontAwesomeIcon icon={faShareSquare} /> 
              <span>{t('share')}</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className={styles.repliesContainer} id="repliesSection">
        <div className={styles.repliesHeader}>
          <div className={styles.repliesTitle}>
            {t('replies')} <span className={styles.repliesCount}>{topicReplies.length}</span>
          </div>
          <div className={styles.repliesSort}>
            <button 
              className={`${styles.sortOption} ${sortOrder === 'latest' ? styles.active : ''}`}
              onClick={() => handleSortChange('latest')}
            >
              {t('latest')}
            </button>
            <button 
              className={`${styles.sortOption} ${sortOrder === 'oldest' ? styles.active : ''}`}
              onClick={() => handleSortChange('oldest')}
            >
              {t('oldest')}
            </button>
            <button 
              className={`${styles.sortOption} ${sortOrder === 'helpful' ? styles.active : ''}`}
              onClick={() => handleSortChange('helpful')}
            >
              {t('mostHelpful')}
            </button>
          </div>
        </div>
        
        <div className={styles.replyList}>
          {topicReplies.length === 0 ? (
            <p className={styles.noReplies}>{t('beFirstToReply')}</p>
          ) : (
            topicReplies.map((reply) => (
              <div key={reply.id} className={styles.replyCard}>
                <div className={styles.replyHeader}>
                  <span className={styles.replyAuthor}>{reply.username}</span>
                  <span className={styles.replyTime}>{reply.time}</span>
                </div>
                <div className={styles.replyContent}>{reply.content}</div>
                <div className={styles.replyFooter}>
                  <button className={styles.likeButton}>
                    <FontAwesomeIcon icon={faHeart} />
                    <span>{reply.likes} {t('likes')}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className={styles.postReply}>
        <h3 className={styles.postReplyTitle}>
          <FontAwesomeIcon icon={faComments} />
          <span>{t('postYourReply')}</span>
        </h3>
        <form className={styles.replyForm} onSubmit={handleReplySubmit}>
          <textarea 
            className={styles.replyTextarea}
            placeholder={t('shareYourThoughts')}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            required
          ></textarea>
          <div className={styles.replyFormFooter}>
            <p className={styles.formNote}>{t('beKindRespectful')}</p>
            <button type="submit" className={styles.submitBtn}>
              {t('postReply')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TopicDetailPage; 