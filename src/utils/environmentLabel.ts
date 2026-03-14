export function isLocalRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
}

export function withLocalSuffix(label: string): string {
  return isLocalRuntime() ? `${label} - local` : label;
}
