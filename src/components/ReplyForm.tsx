import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      message.warning(t('replyCannotBeEmpty') || 'Reply cannot be empty');
      return;
    }
    if (!postId) {
      message.error(t('cannotSubmitNoPost') || 'Cannot submit: post is not loaded');
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = await getCurrentUserId();

      const replyData: Omit<InsertTables<'replies'>, 'id' | 'created_at' | 'updated_at'> = {
        post_id: postId,
        content: content.trim(),
        is_anonymous: false,
        is_solution: false,
        user_id: userId,
      };

      const newReply = await DatabaseService.createReply(replyData);

      if (newReply) {
        // Success — clear the form and trigger refresh
        setContent('');
        message.success(t('replyPostedSuccess') || 'Reply posted successfully');
        onReplyAdded();
      } else {
        // createReply returned null — DB write failed (auth, network, RLS, etc.).
        // Surface visibly. No silent fallback (runbook hard rule 13).
        message.error(
          t('replyFailedToSubmit') ||
            'Failed to submit reply. Check the browser console for details.'
        );
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      message.error(t('replyFailedToSubmit') || 'Failed to submit reply');
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