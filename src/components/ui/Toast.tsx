import { useEffect, useState } from 'react';
import { subscribeToast, type ToastType } from './toastEmitter';
import '../../styles/Toast.css';

type ToastItem = { id: number; message: string; type: ToastType };

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToast((item) => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { ...item, id }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((entry) => entry.id !== id));
      }, 3200);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="app-toast-container" aria-live="polite" role="status">
      {items.map((item) => (
        <div key={item.id} className={`app-toast app-toast-${item.type}`}>
          {item.message}
        </div>
      ))}
    </div>
  );
}
