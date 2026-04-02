import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import AccessCodeNotebook, { saveAccessCodeToNotebook } from '../AccessCodeNotebook';

const NOTEBOOK_KEY = 'accessCodeNotebook';

describe('AccessCodeNotebook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the toggle button', () => {
    render(<AccessCodeNotebook />);
    const toggleBtn = screen.getByTitle('Open notebook');
    expect(toggleBtn).toBeInTheDocument();
  });

  it('opens the panel when toggle is clicked', () => {
    render(<AccessCodeNotebook />);
    fireEvent.click(screen.getByTitle('Open notebook'));
    expect(screen.getByText('Notebook')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Access code')).toBeInTheDocument();
  });

  it('shows empty state when no codes saved', () => {
    render(<AccessCodeNotebook />);
    fireEvent.click(screen.getByTitle('Open notebook'));
    expect(screen.getByText('No codes saved')).toBeInTheDocument();
  });

  it('adds an entry with code and note', () => {
    render(<AccessCodeNotebook />);
    fireEvent.click(screen.getByTitle('Open notebook'));

    const codeInput = screen.getByPlaceholderText('Access code');
    const noteInput = screen.getByPlaceholderText('Note (e.g. School issue)');

    fireEvent.change(codeInput, { target: { value: 'abc123' } });
    fireEvent.change(noteInput, { target: { value: 'My note' } });

    const addBtn = screen.getByTitle('Add');
    fireEvent.click(addBtn);

    // Code is uppercased
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('My note')).toBeInTheDocument();

    // Verify localStorage
    const stored = JSON.parse(localStorage.getItem(NOTEBOOK_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].code).toBe('ABC123');
    expect(stored[0].note).toBe('My note');
  });

  it('removes an entry when remove button is clicked', () => {
    // Pre-populate
    localStorage.setItem(NOTEBOOK_KEY, JSON.stringify([{ code: 'CODE1', note: 'Note1' }]));

    render(<AccessCodeNotebook />);
    fireEvent.click(screen.getByTitle('Open notebook'));

    expect(screen.getByText('CODE1')).toBeInTheDocument();

    const removeBtn = screen.getByTitle('Remove');
    fireEvent.click(removeBtn);

    expect(screen.queryByText('CODE1')).not.toBeInTheDocument();
    expect(screen.getByText('No codes saved')).toBeInTheDocument();
  });

  it('edits a note by clicking on it', () => {
    localStorage.setItem(NOTEBOOK_KEY, JSON.stringify([{ code: 'CODE1', note: 'Old note' }]));

    render(<AccessCodeNotebook />);
    fireEvent.click(screen.getByTitle('Open notebook'));

    // Click the note to start editing
    fireEvent.click(screen.getByText('Old note'));

    const editInput = screen.getByPlaceholderText('Add a note...');
    fireEvent.change(editInput, { target: { value: 'New note' } });

    const saveBtn = screen.getByTitle('Save');
    fireEvent.click(saveBtn);

    expect(screen.getByText('New note')).toBeInTheDocument();
    expect(screen.queryByText('Old note')).not.toBeInTheDocument();
  });

  it('cancels editing a note', () => {
    localStorage.setItem(NOTEBOOK_KEY, JSON.stringify([{ code: 'CODE1', note: 'Original' }]));

    render(<AccessCodeNotebook />);
    fireEvent.click(screen.getByTitle('Open notebook'));

    fireEvent.click(screen.getByText('Original'));

    const cancelBtn = screen.getByTitle('Cancel');
    fireEvent.click(cancelBtn);

    expect(screen.getByText('Original')).toBeInTheDocument();
  });

  it('does not add empty code', () => {
    render(<AccessCodeNotebook />);
    fireEvent.click(screen.getByTitle('Open notebook'));

    const addBtn = screen.getByTitle('Add');
    fireEvent.click(addBtn);

    expect(screen.getByText('No codes saved')).toBeInTheDocument();
  });

  it('shows "Saved!" flash after adding entry', () => {
    vi.useFakeTimers();

    render(<AccessCodeNotebook />);
    fireEvent.click(screen.getByTitle('Open notebook'));

    fireEvent.change(screen.getByPlaceholderText('Access code'), { target: { value: 'XYZ' } });
    fireEvent.click(screen.getByTitle('Add'));

    expect(screen.getByText('Saved!')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('loads entries from localStorage on mount', () => {
    localStorage.setItem(NOTEBOOK_KEY, JSON.stringify([
      { code: 'AAA', note: 'First' },
      { code: 'BBB', note: 'Second' },
    ]));

    render(<AccessCodeNotebook />);
    fireEvent.click(screen.getByTitle('Open notebook'));

    expect(screen.getByText('AAA')).toBeInTheDocument();
    expect(screen.getByText('BBB')).toBeInTheDocument();
  });

  it('adds entry via Enter key on code input', () => {
    render(<AccessCodeNotebook />);
    fireEvent.click(screen.getByTitle('Open notebook'));

    const codeInput = screen.getByPlaceholderText('Access code');
    fireEvent.change(codeInput, { target: { value: 'ENTER1' } });
    fireEvent.keyDown(codeInput, { key: 'Enter' });

    expect(screen.getByText('ENTER1')).toBeInTheDocument();
  });

  it('renders debug button', () => {
    render(<AccessCodeNotebook />);
    fireEvent.click(screen.getByTitle('Open notebook'));
    expect(screen.getByText('Debug')).toBeInTheDocument();
  });

  it('closes panel when toggle is clicked again', () => {
    render(<AccessCodeNotebook />);
    fireEvent.click(screen.getByTitle('Open notebook'));
    expect(screen.getByText('Notebook')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Close notebook'));
    expect(screen.queryByText('Notebook')).not.toBeInTheDocument();
  });
});

describe('saveAccessCodeToNotebook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves a new access code to localStorage', () => {
    saveAccessCodeToNotebook('NEW123', 'test note');

    const stored = JSON.parse(localStorage.getItem(NOTEBOOK_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual({ code: 'NEW123', note: 'test note' });
  });

  it('does not duplicate existing codes', () => {
    localStorage.setItem(NOTEBOOK_KEY, JSON.stringify([{ code: 'EXIST', note: '' }]));
    saveAccessCodeToNotebook('EXIST', 'another note');

    const stored = JSON.parse(localStorage.getItem(NOTEBOOK_KEY)!);
    expect(stored).toHaveLength(1);
  });

  it('does not save empty/whitespace code', () => {
    saveAccessCodeToNotebook('   ', 'note');
    const stored = localStorage.getItem(NOTEBOOK_KEY);
    expect(stored).toBeNull();
  });

  it('appends to existing entries', () => {
    localStorage.setItem(NOTEBOOK_KEY, JSON.stringify([{ code: 'A', note: '1' }]));
    saveAccessCodeToNotebook('B', '2');

    const stored = JSON.parse(localStorage.getItem(NOTEBOOK_KEY)!);
    expect(stored).toHaveLength(2);
    expect(stored[1].code).toBe('B');
  });
});
