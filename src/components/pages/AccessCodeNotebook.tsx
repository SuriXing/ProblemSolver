import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface NotebookEntry {
  code: string;
  note: string;
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
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);
  const notebookRef = useRef<HTMLDivElement>(null);

  const loadEntries = () => {
    try {
      const saved = localStorage.getItem(NOTEBOOK_KEY);
      if (saved) {
        const parsedEntries = JSON.parse(saved);
        setEntries(parsedEntries);
        console.log('Loaded notebook entries:', parsedEntries);
      } else {
        setEntries([]);
        console.log('No notebook entries found');
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

  useEffect(() => {
    try {
      localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(entries));
      console.log('Saved notebook entries to localStorage:', entries);
    } catch (error) {
      console.error('Error saving notebook entries:', error);
    }
  }, [entries]);

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

  const addEntry = () => {
    if (!code.trim()) return;
    const newEntry = { code: code.trim(), note: note.trim() };
    const newEntries = [...entries, newEntry];
    setEntries(newEntries);
    setCode('');
    setNote('');
    console.log('Added new entry manually:', newEntry);
  };

  const addAccessCode = (accessCode: string, accessNote: string = '') => {
    // Check if code already exists
    const exists = entries.some(entry => entry.code === accessCode);
    if (!exists && accessCode.trim()) {
      const newEntry = { code: accessCode.trim(), note: accessNote.trim() };
      const newEntries = [...entries, newEntry];
      setEntries(newEntries);
      console.log('Added new entry via ref:', newEntry);
    }
  };

  useImperativeHandle(ref, () => ({
    addAccessCode
  }));

  const removeEntry = (idx: number) => {
    const newEntries = entries.filter((_, i) => i !== idx);
    setEntries(newEntries);
    console.log('Removed entry at index:', idx);
  };

  const debugNotebook = () => {
    console.log('=== NOTEBOOK DEBUG ===');
    console.log('Current entries state:', entries);
    console.log('LocalStorage raw:', localStorage.getItem(NOTEBOOK_KEY));
    try {
      const stored = localStorage.getItem(NOTEBOOK_KEY);
      if (stored) {
        console.log('LocalStorage parsed:', JSON.parse(stored));
      } else {
        console.log('No data in localStorage');
      }
    } catch (error) {
      console.error('Error parsing localStorage:', error);
    }
    console.log('=== END DEBUG ===');
  };

  const openNameDetectionDemo = () => {
    window.open('#/name-detection-demo', '_blank');
  };

  const openAdminLogin = () => {
    window.open('#/admin/login', '_blank');
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
        <div style={{ padding: '10px 12px 12px 12px' }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Notebook</div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Access code"
              value={code}
              onChange={e => setCode(e.target.value)}
              style={{ flex: 1, padding: '4px 6px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13 }}
              maxLength={32}
            />
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Note (optional)"
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{ flex: 1, padding: '4px 6px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13 }}
              maxLength={40}
            />
            <button
              onClick={addEntry}
              style={{ background: '#4f7cff', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
              title="Add"
            >+
            </button>
          </div>
          <div style={{ marginBottom: 8, display: 'flex', gap: 4 }}>
            <button
              onClick={debugNotebook}
              style={{ background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
              title="Debug"
            >Debug
            </button>
            <button
              onClick={openAdminLogin}
              style={{ background: '#722ed1', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
              title="Admin Login"
            >Admin
            </button>
          </div>
          <div style={{ maxHeight: 120, overflowY: 'auto' }}>
            {entries.length === 0 ? (
              <div style={{ color: '#888', fontSize: 13, textAlign: 'center' }}>No codes saved</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {entries.map((entry, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, background: '#f5f7fa', borderRadius: 3, padding: '2px 6px', marginRight: 4 }}>{entry.code}</span>
                    {entry.note && <span style={{ color: '#666', fontSize: 12, marginRight: 4 }}>({entry.note})</span>}
                    <button
                      onClick={() => removeEntry(idx)}
                      style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: 15, marginLeft: 'auto' }}
                      title="Remove"
                    >×</button>
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