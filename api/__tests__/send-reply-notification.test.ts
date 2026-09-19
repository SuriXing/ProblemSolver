import { describe, it, expect, beforeEach, vi } from 'vitest';
import handler, { __resetRateLimits } from '../send-reply-notification';

// ---------------------------------------------------------------------------
// Test harness — fake Vercel req/res
//
// S3.3: the only accepted caller is the DB trigger, authenticated by the
// shared secret. There is no Origin path anymore — requests shaped like the
// old browser callers must be rejected.
// ---------------------------------------------------------------------------

const TEST_SECRET = 'test-trigger-secret';

function makeReq(overrides: Partial<{
  method: string;
  headers: Record<string, string>;
  body: any;
}> = {}) {
  return {
    method: 'POST',
    headers: { 'x-trigger-secret': TEST_SECRET },
    body: {
      email: 'user@example.com',
      postId: 'p1',
      accessCode: 'AB12CD34',
      postContent: 'help me',
      replyContent: 'here is help',
    },
    ...overrides,
  };
}

function makeRes() {
  const res: any = {};
  res.status = vi.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn().mockImplementation((body: any) => {
    res.body = body;
    return res;
  });
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
  __resetRateLimits();
  process.env.NOTIFICATION_TRIGGER_SECRET = TEST_SECRET;
  process.env.APP_BASE_URL = 'https://anoncafe.life';
  delete process.env.RESEND_API_KEY; // default to stub-mode unless test overrides
  delete process.env.RESEND_FROM_ADDRESS;
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Method gate
// ---------------------------------------------------------------------------

describe('method gate', () => {
  it('rejects GET with 405', async () => {
    const req = makeReq({ method: 'GET' });
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });
});

// ---------------------------------------------------------------------------
// Shared-secret gate (S3.3)
// ---------------------------------------------------------------------------

describe('shared-secret gate', () => {
  it('returns 500 when NOTIFICATION_TRIGGER_SECRET is missing (fail closed)', async () => {
    delete process.env.NOTIFICATION_TRIGGER_SECRET;
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
    expect(res.body.reason).toBe('misconfigured');
  });

  it('returns 403 when the secret header is missing', async () => {
    const req = makeReq({ headers: {} });
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
    expect(res.body.reason).toBe('forbidden');
  });

  it('returns 403 when the secret is wrong', async () => {
    const req = makeReq({ headers: { 'x-trigger-secret': 'wrong-secret' } });
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
    expect(res.body.reason).toBe('forbidden');
  });

  it('rejects the old browser shape (valid Origin, no secret) with 403', async () => {
    // The S3.1-era accepted request shape must not authenticate anymore.
    const req = makeReq({
      headers: {
        origin: 'https://anoncafe.life',
        'x-forwarded-for': '203.0.113.7',
      },
    });
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
    expect(res.body.reason).toBe('forbidden');
  });
});

// ---------------------------------------------------------------------------
// Field validation + length caps
// ---------------------------------------------------------------------------

describe('input validation', () => {
  it('rejects missing email', async () => {
    const req = makeReq({ body: { replyContent: 'hi' } });
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects bad email format', async () => {
    const req = makeReq({
      body: {
        email: 'not-an-email',
        replyContent: 'hi',
      },
    });
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects oversized replyContent', async () => {
    const req = makeReq({
      body: {
        email: 'a@b.co',
        replyContent: 'x'.repeat(5_001),
      },
    });
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects oversized postContent', async () => {
    const req = makeReq({
      body: {
        email: 'a@b.co',
        replyContent: 'ok',
        postContent: 'x'.repeat(2_001),
      },
    });
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects oversized accessCode', async () => {
    const req = makeReq({
      body: {
        email: 'a@b.co',
        replyContent: 'ok',
        accessCode: 'x'.repeat(65),
      },
    });
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Rate limit — recipient axis only (S3.3 dropped the per-IP axis: trigger
// calls share Supabase's egress IP, so that bucket would be a shared
// false-positive).
// ---------------------------------------------------------------------------

describe('rate limit', () => {
  it('blocks more than 5 emails to the same recipient inside the window', async () => {
    for (let i = 0; i < 5; i++) {
      const res = makeRes();
      await handler(makeReq(), res);
      expect(res.statusCode).toBe(200);
    }
    const blocked = makeRes();
    await handler(makeReq(), blocked);
    expect(blocked.statusCode).toBe(429);
    expect(blocked.body.reason).toBe('rate_limit_recipient');
  });

  it('keeps counting separate recipients independently', async () => {
    for (let i = 0; i < 5; i++) {
      const res = makeRes();
      await handler(
        makeReq({ body: { email: `user${i}@example.com`, replyContent: 'hi' } }),
        res,
      );
      expect(res.statusCode).toBe(200);
    }
    const res = makeRes();
    await handler(
      makeReq({ body: { email: 'user-final@example.com', replyContent: 'hi' } }),
      res,
    );
    expect(res.statusCode).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Stub mode (no Resend key)
// ---------------------------------------------------------------------------

describe('stub mode', () => {
  it('returns sent:false reason:no_api_key when RESEND_API_KEY is unset', async () => {
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ sent: false, reason: 'no_api_key' });
  });
});

// ---------------------------------------------------------------------------
// Real send path (mocked fetch)
// ---------------------------------------------------------------------------

describe('real send path', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_fake_test_key';
  });

  it('calls Resend with html-escaped body and the env From address', async () => {
    process.env.RESEND_FROM_ADDRESS = 'no-reply@mail.example.me';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'msg-1' }),
      text: async () => '',
    });
    vi.stubGlobal('fetch', fetchMock);

    const req = makeReq({
      body: {
        email: 'user@example.com',
        replyContent: '<script>alert(1)</script>',
        postContent: '<img onerror=x>',
        accessCode: 'AB12',
      },
    });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ sent: true, id: 'msg-1' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    const sentBody = JSON.parse(init.body);
    expect(sentBody.from).toBe('Problem Solver <no-reply@mail.example.me>');
    expect(sentBody.to).toEqual(['user@example.com']);
    expect(sentBody.html).not.toContain('<script>');
    expect(sentBody.html).toContain('&lt;script&gt;');
    expect(sentBody.html).toContain('&lt;img onerror=x&gt;');
    // viewUrl comes from APP_BASE_URL, never from the request
    expect(sentBody.html).toContain('https://anoncafe.life/#/past-questions?code=AB12');
  });

  it('defaults the footer link to anoncafe.life when APP_BASE_URL is unset', async () => {
    delete process.env.APP_BASE_URL;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'm' }),
      text: async () => '',
    });
    vi.stubGlobal('fetch', fetchMock);

    const req = makeReq({ body: { email: 'a@b.co', replyContent: 'ok', accessCode: 'ZZ99' } });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse(init.body).html).toContain('https://anoncafe.life/#/past-questions?code=ZZ99');
  });

  it('returns 502 when Resend returns non-OK', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({}),
        text: async () => 'invalid from',
      }),
    );
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(502);
    expect(res.body.reason).toBe('resend_error');
  });

  it('returns 500 on fetch exception WITHOUT leaking error message to client', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('SECRET-INTERNAL-PATH-/var/x')));
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
    expect(res.body.reason).toBe('exception');
    // S3.2 round 1 fix: do not echo err.message back to caller — info leak.
    expect(JSON.stringify(res.body)).not.toContain('SECRET-INTERNAL-PATH');
    expect(res.body.message).toBeUndefined();
  });
});
