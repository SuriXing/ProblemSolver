// Tiny toast emitter — the function half of the Toast component split so
// react-refresh stays happy (a file may not export both a component and
// plain functions).
export type ToastType = 'success' | 'warning' | 'error' | 'info';

type Listener = (item: { message: string; type: ToastType }) => void;

let listeners: Listener[] = [];

export function subscribeToast(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((entry) => entry !== listener);
  };
}

export function showToast(message: string, type: ToastType = 'success'): void {
  listeners.forEach((listener) => listener({ message, type }));
}
