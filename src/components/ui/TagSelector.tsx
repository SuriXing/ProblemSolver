import React, { useState, useEffect } from 'react';
import { useTypeSafeTranslation } from '../../utils/translationHelper';

interface TagSelectorProps {
  onTagsSelected: (tags: string[]) => void;
  initialTags?: string[];
  labelText?: string;
}

const TagSelector: React.FC<TagSelectorProps> = ({ 
  onTagsSelected, 
  initialTags = [],
  labelText = 'Add tags (optional):' 
}) => {
  const { t } = useTypeSafeTranslation();
  const [inputValue, setInputValue] = useState('');
  const [tags, setTags] = useState<string[]>(initialTags);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Safe translation function
  const safeT = (key: string, fallback: string) => {
    try {
      const translation = t(key);
      return translation === key ? fallback : translation;
    } catch (e) {
      console.warn(`Translation error for key '${key}':`, e);
      return fallback;
    }
  };

  // Common tags that users can select (can be expanded)
  const commonTags = [
    { id: 'anxiety', label: safeT('tagAnxiety', 'Anxiety') },
    { id: 'depression', label: safeT('tagDepression', 'Depression') },
    { id: 'relationships', label: safeT('tagRelationships', 'Relationships') },
    { id: 'work', label: safeT('tagWork', 'Work') },
    { id: 'family', label: safeT('tagFamily', 'Family') },
    { id: 'health', label: safeT('tagHealth', 'Health') },
    { id: 'social', label: safeT('tagSocial', 'Social') },
    { id: 'other', label: safeT('tagOther', 'Other') }
  ];

  useEffect(() => {
    // Notify parent component when tags change
    onTagsSelected(tags);
  }, [tags, onTagsSelected]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (
      trimmedTag &&
      !tags.includes(trimmedTag) &&
      !commonTags.some(t => t.id === trimmedTag) // Prevent adding a common tag as custom
    ) {
      setTags([...tags, trimmedTag]);
      setInputValue('');
      setShowCustomInput(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  const handleCommonTagClick = (tagId: string) => {
    if (tagId === 'other') {
      setShowCustomInput((prev) => !prev);
      setInputValue('');
      return;
    }
    if (!tags.includes(tagId)) {
      setTags([...tags, tagId]);
    } else {
      removeTag(tagId);
    }
  };

  return (
    <div className="tag-selector">
      <label className="tag-label">{labelText}</label>
      
      <div className="common-tags">
        {commonTags.map(tag => (
          <button
            type="button"
            key={tag.id}
            className={`tag-chip ${tags.includes(tag.id) ? 'selected' : ''}${tag.id === 'other' && showCustomInput ? ' selected' : ''}`}
            onClick={() => handleCommonTagClick(tag.id)}
          >
            {tag.label}
          </button>
        ))}
      </div>
      
      {showCustomInput && (
        <div className="tag-input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => inputValue && addTag(inputValue)}
            placeholder={safeT('customTagPlaceholder', 'Type custom tag and press Enter')}
            className="tag-input"
            autoFocus
          />
        </div>
      )}
      
      <div className="selected-tags">
        {tags.length > 0 && (
          <div className="tags-list">
            {tags.map(tag => (
              // Only show tags that are not 'other'
              commonTags.find(t => t.id === tag && t.id === 'other') ? null : (
                <span key={tag} className="tag">
                  {commonTags.find(t => t.id === tag)?.label || tag}
                  <button 
                    type="button" 
                    className="remove-tag" 
                    onClick={() => removeTag(tag)}
                    aria-label={safeT('removeTag', 'Remove tag')}
                  >
                    ×
                  </button>
                </span>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagSelector; 