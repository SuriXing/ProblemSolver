import { vi } from 'vitest';

// Chainable query builder mock
export function createQueryBuilder(overrides: Record<string, any> = {}) {
  const defaultResult = { data: null, error: null, count: null };
  const result = { ...defaultResult, ...overrides };

  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: vi.fn((resolve: any) => resolve(result)),
  };

  // Make the builder itself thenable (for awaiting without .single())
  builder[Symbol.for('vitest:thenable')] = true;
  // When awaited directly, resolve with result
  Object.defineProperty(builder, 'then', {
    value: (onFulfilled: any, onRejected?: any) => {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
  });

  return builder;
}

export function createSupabaseMock() {
  const mock = {
    from: vi.fn().mockReturnValue(createQueryBuilder()),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signIn: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  };

  return mock;
}

// Default shared mock instance
export const supabaseMock = createSupabaseMock();

// Mock the supabase modules
vi.mock('../../lib/supabase', () => ({
  supabase: supabaseMock,
  checkSupabaseConnection: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../utils/supabaseClient', () => ({
  supabase: supabaseMock,
}));
