import React, { useState } from 'react';
import { DatabaseService } from '../services/database.service';
import { InsertTables } from '../types/database.types';
import { useTypeSafeTranslation } from '../utils/translationHelper';
import { getCurrentUserId } from '../utils/authHelpers';
import { checkThrottle, recordAction, THROTTLE_RULES } from '../utils/rateLimit';
import { showToast } from './ui/toastEmitter';

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
      showToast(t('replyCannotBeEmpty') || 'Reply cannot be empty', 'warning');
      return;
    }
    if (!postId) {
      showToast(t('cannotSubmitNoPost') || 'Cannot submit: post is not loaded', 'error');
      return;
    }

    const throttle = checkThrottle(THROTTLE_RULES.reply);
    if (!throttle.allowed) {
      const secs = Math.ceil(throttle.retryAfterMs / 1000);
      showToast(
        (t('throttleTryAgainIn', { seconds: secs }) as string) ||
          `You're replying too fast. Please try again in ${secs}s.`,
        'warning',
      );
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
        recordAction(THROTTLE_RULES.reply);
        setContent('');
        showToast(t('replyPostedSuccess') || 'Reply posted successfully', 'success');
        onReplyAdded();
      } else {
        // createReply returned null — DB write failed (auth, network, RLS, etc.).
        // Surface visibly. No silent fallback (runbook hard rule 13).
        showToast(
          t('replyFailedToSubmit') || 'Failed to submit reply. Check the browser console for details.',
          'error',
        );
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      showToast(t('replyFailedToSubmit') || 'Failed to submit reply', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="reply-form-native"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <label htmlFor="reply-content" className="sr-only">
        {t('yourReply')}
      </label>
      <textarea
        id="reply-content"
        className="reply-textarea"
        rows={4}
        maxLength={4000}
        value={content}
        onChange={(event) => setContent(event.target.value.slice(0, 4000))}
        placeholder={t('replyPlaceholder')}
      />
      <div className="reply-form-footer">
        <span className="reply-char-count">{content.length}/4000</span>
        <button
          type="submit"
          className="btn-primary-outline"
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? t('submitting') : t('submitReply')}
        </button>
      </div>
    </form>
  );
};

export default ReplyForm;
