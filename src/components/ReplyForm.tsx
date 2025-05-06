import React, { useState } from 'react';
import { Form, Input, Button, Checkbox } from 'antd';
import { DatabaseService } from '../services/database.service';
import { InsertTables } from '../types/database.types';
import { useTypeSafeTranslation } from '../utils/translationHelper';
import { getCurrentUserId } from '../utils/authHelpers';

interface ReplyFormProps {
  postId: string;
  onReplyAdded: () => void;
}

const ReplyForm: React.FC<ReplyFormProps> = ({ postId, onReplyAdded }) => {
  const { t } = useTypeSafeTranslation();
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!content.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get the current user ID
      const userId = await getCurrentUserId();
      
      const replyData: Omit<InsertTables<'replies'>, 'id' | 'created_at' | 'updated_at'> = {
        post_id: postId,
        content,
        is_anonymous: isAnonymous,
        is_solution: false,
        user_id: userId
      };
      
      const newReply = await DatabaseService.createReply(replyData);
      
      if (newReply) {
        setContent('');
        onReplyAdded();
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form layout="vertical" onFinish={handleSubmit}>
      <Form.Item label={t('yourReply')}>
        <Input.TextArea 
          rows={4} 
          value={content} 
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('replyPlaceholder')}
        />
      </Form.Item>
      
      <Form.Item>
        <Checkbox 
          checked={isAnonymous} 
          onChange={(e) => setIsAnonymous(e.target.checked)}
        >
          {t('postAnonymously')}
        </Checkbox>
      </Form.Item>
      
      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={isSubmitting}
          disabled={!content.trim()}
        >
          {t('submitReply')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ReplyForm; 