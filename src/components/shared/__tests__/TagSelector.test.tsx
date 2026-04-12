import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TagSelector from '../TagSelector';

describe('TagSelector (shared)', () => {
  const tags = ['Anxiety', 'Work', 'Family'];

  it('renders all tags', () => {
    render(<TagSelector tags={tags} selectedTags={[]} onTagToggle={vi.fn()} />);
    tags.forEach(tag => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
  });

  it('calls onTagToggle when tag is clicked', () => {
    const onToggle = vi.fn();
    render(<TagSelector tags={tags} selectedTags={[]} onTagToggle={onToggle} />);
    fireEvent.click(screen.getByText('Work'));
    expect(onToggle).toHaveBeenCalledWith('Work');
  });

  it('applies selected class to selected tags', () => {
    const { container } = render(
      <TagSelector tags={tags} selectedTags={['Anxiety']} onTagToggle={vi.fn()} />
    );
    // The selected tag should have the 'selected' CSS module class
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(3);
  });

  it('toggles tag on click', () => {
    const onToggle = vi.fn();
    render(<TagSelector tags={tags} selectedTags={['Family']} onTagToggle={onToggle} />);
    fireEvent.click(screen.getByText('Family'));
    expect(onToggle).toHaveBeenCalledWith('Family');
  });

  it('renders empty when no tags', () => {
    const { container } = render(<TagSelector tags={[]} selectedTags={[]} onTagToggle={vi.fn()} />);
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});
