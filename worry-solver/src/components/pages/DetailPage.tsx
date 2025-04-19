import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faClock, 
  faArrowLeft,
  faExclamationCircle,
  faPaperPlane,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { retrievePostData, checkAccessCode, storePostData } from '../../utils/storage-system';
import { getTimeAgo } from '../../utils/helpers';
import { Post, Reply } from '../../types/post';

const DetailPage: React.FC = () => {
  const { t } = useTypeSafeTranslation();
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();
  
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  
  useEffect(() => {
    if (accessCode) {
      fetchPost(accessCode);
    } else {
      setError('No access code provided');
      setIsLoading(false);
    }
  }, [accessCode]);
  
  const fetchPost = (code: string) => {
    setIsLoading(true);
    setError(null);
    
    setTimeout(() => {
      if (!checkAccessCode(code)) {
        setError('Invalid access code');
        setIsLoading(false);
        return;
      }
      
      const userData = retrievePostData(code);
      
      if (!userData) {
        setError('Error retrieving post data');
        setIsLoading(false);
        return;
      }
      
      setPost(userData);
      setIsLoading(false);
    }, 1000);
  };
  
  const handleSubmitReply = async () => {
    if (!replyText.trim() || !post || !accessCode) return;
    
    setIsSubmitting(true);
    
    try {
      // Generate a random helper ID
      const helperId = Math.random().toString(36).substring(2, 10);
      
      const newReply: Reply = {
        id: `reply-${Date.now()}`,
        author: `Helper #${helperId.substring(0, 4)}`,
        content: replyText,
        createdAt: Date.now(),
        isHelper: true
      };
      
      // Get current post data
      const currentData = retrievePostData(accessCode);
      if (!currentData) {
        throw new Error('Could not retrieve post data');
      }
      
      // Add new reply
      const updatedData = {
        ...currentData,
        replies: [...(currentData.replies || []), newReply]
      };
      
      // Update storage
      storePostData(accessCode, updatedData);
      
      // Update local state
      setPost(updatedData);
      setReplySuccess(true);
      setReplyText('');
      
      // Reset success message after a few seconds
      setTimeout(() => {
        setReplySuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting reply:', error);
      setError('Failed to submit reply');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
        <p className="ml-3">Loading...</p>
      </div>
    );
  }
  
  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500 mt-1" />
            <div className="ml-3">
              <p className="text-red-700">{error || 'No question found'}</p>
              <p className="text-red-500 text-sm">Please try again or contact support</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center">
          <Link to="/" className="btn-primary">
            Return Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center text-primary hover:underline">
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Return Home
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faUser} className="text-gray-500 mr-2" />
              <span className="text-gray-700">
                Anonymous User #{post.id?.substring(0, 6) || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <FontAwesomeIcon icon={faClock} className="mr-2" />
              <span>{getTimeAgo(post.createdAt)}</span>
            </div>
          </div>
          
          <h1 className="text-2xl font-semibold mb-4">{post.title || 'Untitled Post'}</h1>
          
          <div className="mb-4 text-gray-700">
            {post.content}
          </div>
          
          <div className="flex flex-wrap gap-2 mb-2">
            {post.tags?.map((tag, index) => (
              <span key={index} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Replies</h2>
        
        {!post.replies || post.replies.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600 mb-2">No replies yet</p>
            <p className="text-sm text-gray-500">Check back later</p>
          </div>
        ) : (
          <div className="space-y-4">
            {post.replies.map((reply, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faUser} className="text-blue-500 mr-2" />
                    <span className="text-blue-600">
                      {reply.author || `Anonymous Helper #${index}`}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {getTimeAgo(reply.createdAt)}
                  </div>
                </div>
                <p className="text-gray-700">{reply.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-3">Reply to Post</h3>
          <div className="mb-4">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Share your advice, experience or encouraging words..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button
              className="btn-primary"
              onClick={handleSubmitReply}
              disabled={!replyText.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner-sm mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                  Send Reply
                </>
              )}
            </button>
          </div>
          
          {replySuccess && (
            <div className="mt-4 bg-green-50 text-green-700 p-3 rounded-lg flex items-center">
              <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
              <span>Reply sent! Thank you for helping.</span>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default DetailPage;
