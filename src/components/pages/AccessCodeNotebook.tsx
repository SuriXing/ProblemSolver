import React, { useState, useEffect, useRef } from 'react';

interface NotebookEntry {
  code: string;
  note: string;
}

const NOTEBOOK_KEY = 'accessCodeNotebook';

const AccessCodeNotebook: React.FC = () => {
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);
  const notebookRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(NOTEBOOK_KEY);
    if (saved) {
      setEntries(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(entries));
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
    setEntries(prev => [...prev, { code: code.trim(), note: note.trim() }]);
    setCode('');
    setNote('');
  };

  const removeEntry = (idx: number) => {
    setEntries(prev => prev.filter((_, i) => i !== idx));
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
};

export default AccessCodeNotebook; 