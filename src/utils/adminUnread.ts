// Admin "unread" tracking for posts and replies.
//
// Stores per-stream "last seen at" timestamps in localStorage. Anything
// created after that timestamp counts as unread. A "mark all read" call
// snaps the timestamp forward to now.
//
// localStorage keys:
//   admin_last_seen_posts_at   ISO timestamp
//   admin_last_seen_replies_at ISO timestamp
//
// Per-admin scoping: not implemented — single-admin assumption from U-X6
// (see docs/admin-setup.md). If you ever support multiple admins, scope by
// auth.uid().

const POSTS_KEY = 'admin_last_seen_posts_at';
const REPLIES_KEY = 'admin_last_seen_replies_at';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, iso: string): void {
  try {
    localStorage.setItem(key, iso);
  } catch {
    // localStorage unavailable (private mode etc.) — fail silently. Worst case
    // is the unread badge stays "on" which is harmless.
  }
}

export function getLastSeenPostsAt(): string | null {
  return read(POSTS_KEY);
}

export function getLastSeenRepliesAt(): string | null {
  return read(REPLIES_KEY);
}

export function markAllPostsRead(): void {
  write(POSTS_KEY, new Date().toISOString());
}

export function markAllRepliesRead(): void {
  write(REPLIES_KEY, new Date().toISOString());
}

export function isUnread(createdAt: string, lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return true; // never seen anything → all unread
  return new Date(createdAt).getTime() > new Date(lastSeenAt).getTime();
}

export function countUnread<T extends { created_at: string }>(
  items: T[],
  lastSeenAt: string | null,
): number {
  return items.filter((item) => isUnread(item.created_at, lastSeenAt)).length;
}
