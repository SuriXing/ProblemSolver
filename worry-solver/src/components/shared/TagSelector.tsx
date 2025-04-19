import React from 'react';
import styles from './TagSelector.module.css';

interface TagSelectorProps {
  tags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

const TagSelector: React.FC<TagSelectorProps> = ({ 
  tags, 
  selectedTags, 
  onTagToggle 
}) => {
  return (
    <div className={styles.container}>
      {tags.map(tag => (
        <button
          key={tag}
          className={`${styles.tag} ${
            selectedTags.includes(tag) ? styles.selected : ''
          }`}
          onClick={() => onTagToggle(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
};

export default TagSelector;
