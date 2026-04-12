import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatabaseService } from '../../services/database.service';

interface NotebookEntry {
  code: string;
  note: string;
  solved?: boolean;
}

export interface AccessCodeNotebookRef {
  addAccessCode: (code: string, note?: string) => void;
}

const NOTEBOOK_KEY = 'accessCodeNotebook';

// Global utility function to save access codes
export const saveAccessCodeToNotebook = (accessCode: string, note: string = '') => {
  try {
    const saved = localStorage.getItem(NOTEBOOK_KEY);
    const entries: NotebookEntry[] = saved ? JSON.parse(saved) : [];
    
    // Check if code already exists
    const exists = entries.some(entry => entry.code === accessCode);
    if (!exists && accessCode.trim()) {
      entries.push({ code: accessCode.trim(), note: note.trim() });
      localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(entries));
      
      // Trigger update event for same-tab refresh
      window.dispatchEvent(new CustomEvent('notebookUpdate'));
      console.log('Access code saved to notebook:', accessCode);
    } else {
      console.log('Access code already exists in notebook:', accessCode);
    }
  } catch (error) {
    console.error('Error saving access code to notebook:', error);
  }
};

const AccessCodeNotebook = forwardRef<AccessCodeNotebookRef>((props, ref) => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState('');
  const [open, setOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const notebookRef = useRef<HTMLDivElement>(null);

  const loadEntries = () => {
    try {
      const saved = localStorage.getItem(NOTEBOOK_KEY);
      if (saved) {
        const parsedEntries = JSON.parse(saved);
        setEntries(parsedEntries);
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error('Error loading notebook entries:', error);
      setEntries([]);
    }
  };

  useEffect(() => {
    loadEntries();
    
    // Listen for custom events for same-tab updates
    const handleNotebookUpdate = () => {
      console.log('Notebook update event received');
      loadEntries();
    };
    
    window.addEventListener('notebookUpdate', handleNotebookUpdate);
    
    return () => {
      window.removeEventListener('notebookUpdate', handleNotebookUpdate);
    };
  }, []);

  const saveEntries = (newEntries: NotebookEntry[]) => {
    setEntries(newEntries);
    try {
      localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(newEntries));
    } catch (error) {
      console.error('Error saving notebook entries:', error);
    }
  };

  // Close notebook on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (notebookRef.current && !notebookRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const showSavedFlash = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const addEntry = () => {
    if (!code.trim()) return;
    const newEntry = { code: code.trim().toUpperCase(), note: note.trim() };
    saveEntries([...entries, newEntry]);
    setCode('');
    setNote('');
    showSavedFlash();
  };

  const startEditingNote = (idx: number) => {
    setEditingIdx(idx);
    setEditingNote(entries[idx].note || '');
  };

  const saveEditingNote = () => {
    if (editingIdx === null) return;
    const updated = entries.map((entry, i) =>
      i === editingIdx ? { ...entry, note: editingNote.trim() } : entry
    );
    saveEntries(updated);
    setEditingIdx(null);
    setEditingNote('');
  };

  const cancelEditingNote = () => {
    setEditingIdx(null);
    setEditingNote('');
  };

  const addAccessCode = (accessCode: string, accessNote: string = '') => {
    const exists = entries.some(entry => entry.code === accessCode);
    if (!exists && accessCode.trim()) {
      const newEntry = { code: accessCode.trim(), note: accessNote.trim() };
      saveEntries([...entries, newEntry]);
    }
  };

  useImperativeHandle(ref, () => ({
    addAccessCode
  }));

  const removeEntry = (idx: number) => {
    saveEntries(entries.filter((_, i) => i !== idx));
  };

  // Copy just the access code — that's what the user actually wants to share
  const copyCode = (idx: number) => {
    const entry = entries[idx];
    navigator.clipboard.writeText(entry.code).then(
      () => {
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 1500);
      },
      () => {
        console.error('Failed to copy code to clipboard');
      }
    );
  };

  // Navigate to the problem page with the access code — PastQuestionsPage auto-fetches
  const goToProblem = (idx: number) => {
    const entry = entries[idx];
    setOpen(false);
    navigate(`/past-questions?code=${entry.code}`);
  };

  // Toggle solved state locally AND update the DB post status
  const toggleSolved = async (idx: number) => {
    const entry = entries[idx];
    const newSolved = !entry.solved;

    // Optimistic local update first — UI feels instant
    const updated = entries.map((e, i) => (i === idx ? { ...e, solved: newSolved } : e));
    saveEntries(updated);

    // Then update the DB. If it fails, the user still sees their local state;
    // we log the error but don't revert because the local notebook is the user's
    // personal view and the DB status is secondary.
    try {
      await DatabaseService.updatePostStatusByAccessCode(
        entry.code,
        newSolved ? 'solved' : 'open'
      );
    } catch (err) {
      console.error('Failed to update post status in DB:', err);
    }
  };

  return (
    <div
      ref={notebookRef}
      style={{
        position: 'fixed',
        left: 20,
        bottom: 20,
        zIndex: 9999,
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 12px rgba(0,0,0,0.13)',
        width: open ? 260 : 48,
        minHeight: 48,
        transition: 'width 0.2s',
        overflow: 'hidden',
        border: '1px solid #eee',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 48,
          height: 48,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 22,
          color: '#4f7cff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title={open ? 'Close notebook' : 'Open notebook'}
      >
        🗒️
      </button>
      {open && (
        <div style={{ padding: '10px 12px 12px 12px', boxSizing: 'border-box', width: '100%' }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Notebook</div>

          {/* Code input */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            <input
              type="text"
              placeholder="Access code"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && addEntry()}
              style={{ flex: 1, minWidth: 0, padding: '4px 6px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13, fontFamily: 'monospace', textTransform: 'uppercase', boxSizing: 'border-box' }}
              maxLength={32}
            />
          </div>

          {/* Note input */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Note (e.g. School issue)"
              value={note}
              onChange={e => setNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEntry()}
              style={{ flex: 1, minWidth: 0, padding: '4px 6px', borderRadius: 4, border: '1px solid #ddd', fontSize: 12, color: '#666', boxSizing: 'border-box' }}
              maxLength={60}
            />
            <button
              onClick={addEntry}
              style={{ background: '#4f7cff', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 13, cursor: 'pointer', fontWeight: 500, flexShrink: 0 }}
              title="Add"
            >+
            </button>
          </div>

          {savedFlash && (
            <div style={{ color: '#52c41a', fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 6 }}>
              Saved!
            </div>
          )}

          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {entries.length === 0 ? (
              <div style={{ color: '#888', fontSize: 13, textAlign: 'center' }}>No codes saved</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {entries.map((entry, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      marginBottom: 8,
                      padding: '6px 8px',
                      background: entry.solved ? '#f0faf0' : '#f8f9fb',
                      borderRadius: 5,
                      border: entry.solved ? '1px solid #d4edda' : '1px solid #eef0f4',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 12,
                          color: entry.solved ? '#52c41a' : '#333',
                          fontWeight: 600,
                          textDecoration: entry.solved ? 'line-through' : 'none',
                        }}
                      >
                        {entry.code}
                      </span>
                      {entry.solved && (
                        <span style={{ fontSize: 10, color: '#52c41a', fontWeight: 600 }}>✓ solved</span>
                      )}
                      <button
                        onClick={() => removeEntry(idx)}
                        style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: 14, marginLeft: 'auto', padding: 0, lineHeight: 1 }}
                        title="Remove"
                      >×</button>
                    </div>
                    {editingIdx === idx ? (
                      <div style={{ display: 'flex', gap: 3 }}>
                        <input
                          type="text"
                          value={editingNote}
                          onChange={e => setEditingNote(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEditingNote();
                            if (e.key === 'Escape') cancelEditingNote();
                          }}
                          autoFocus
                          placeholder="Add a note..."
                          style={{ flex: 1, padding: '2px 5px', borderRadius: 3, border: '1px solid #4f7cff', fontSize: 11 }}
                          maxLength={60}
                        />
                        <button
                          onClick={saveEditingNote}
                          style={{ background: '#52c41a', color: '#fff', border: 'none', borderRadius: 3, padding: '2px 6px', fontSize: 10, cursor: 'pointer' }}
                          title="Save"
                        >✓</button>
                        <button
                          onClick={cancelEditingNote}
                          style={{ background: '#999', color: '#fff', border: 'none', borderRadius: 3, padding: '2px 6px', fontSize: 10, cursor: 'pointer' }}
                          title="Cancel"
                        >×</button>
                      </div>
                    ) : (
                      <div
                        onClick={() => startEditingNote(idx)}
                        style={{
                          fontSize: 11,
                          color: entry.note ? '#555' : '#aaa',
                          fontStyle: entry.note ? 'normal' : 'italic',
                          cursor: 'pointer',
                          padding: '1px 2px',
                        }}
                        title="Click to edit note"
                      >
                        {entry.note || '+ Add a note'}
                      </div>
                    )}

                    {/* Per-entry action row: copy code, open problem, toggle solved */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      <button
                        onClick={() => copyCode(idx)}
                        style={{
                          flex: 1,
                          background: copiedIdx === idx ? '#52c41a' : '#eef2ff',
                          color: copiedIdx === idx ? '#fff' : '#4f7cff',
                          border: 'none',
                          borderRadius: 3,
                          padding: '3px 6px',
                          fontSize: 10,
                          cursor: 'pointer',
                          fontWeight: 500,
                          transition: 'background 0.15s',
                        }}
                        title="Copy access code to clipboard"
                      >
                        {copiedIdx === idx ? '✓ Copied' : '📋 Copy code'}
                      </button>
                      <button
                        onClick={() => goToProblem(idx)}
                        style={{
                          flex: 1,
                          background: '#eef2ff',
                          color: '#4f7cff',
                          border: 'none',
                          borderRadius: 3,
                          padding: '3px 6px',
                          fontSize: 10,
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                        title="Open this problem"
                      >
                        ↗ Open
                      </button>
                      <button
                        onClick={() => toggleSolved(idx)}
                        style={{
                          flex: 1,
                          background: entry.solved ? '#52c41a' : '#f0faf0',
                          color: entry.solved ? '#fff' : '#52c41a',
                          border: entry.solved ? 'none' : '1px solid #d4edda',
                          borderRadius: 3,
                          padding: '3px 6px',
                          fontSize: 10,
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                        title={entry.solved ? 'Mark as not solved' : 'Mark as solved'}
                      >
                        {entry.solved ? '✓ Solved' : 'Mark solved'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default AccessCodeNotebook; 