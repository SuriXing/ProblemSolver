import { describe, it, expect, beforeEach, vi } from 'vitest';
import handler, { __resetRateLimits } from '../send-reply-notification';

// ---------------------------------------------------------------------------
// Test harness — fake Vercel req/res
// ---------------------------------------------------------------------------

function makeReq(overrides: Partial<{
  method: string;
  headers: Record<string, string>;
  body: any;
}> = {}) {
  return {
    method: 'POST',
    headers: { origin: 'https://problem-solver.app', 'x-forwarded-for': '203.0.113.7' },
    body: {
      email: 'user@example.com',
      postId: 'p1',
      accessCode: 'AB12CD34',
      postContent: 'help me',
      replyContent: 'here is help',
    },
    socket: { remoteAddress: '203.0.113.7' },
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
  process.env.APP_BASE_URL = 'https://problem-solver.app';
  delete process.env.RESEND_API_KEY; // default to stub-mode unless test overrides
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
// Origin allowlist
// ---------------------------------------------------------------------------

describe('origin allowlist', () => {
  it('returns 500 when APP_BASE_URL is missing (fail closed)', async () => {
    delete process.env.APP_BASE_URL;
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
    expect(res.body.reason).toBe('misconfigured');
  });

  it('returns 403 when Origin header is missing', async () => {
    const req = makeReq({ headers: { 'x-forwarded-for': '203.0.113.7' } });
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
    expect(res.body.reason).toBe('forbidden_origin');
  });

  it('returns 403 when Origin does not match APP_BASE_URL', async () => {
    const req = makeReq({
      headers: { origin: 'https://evil.com', 'x-forwarded-for': '203.0.113.7' },
    });
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it('accepts matching Origin (with trailing slash on either side)', async () => {
    process.env.APP_BASE_URL = 'https://problem-solver.app/';
    const req = makeReq({
      headers: { origin: 'https://problem-solver.app', 'x-forwarded-for': '203.0.113.7' },
    });
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
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
// Rate limit
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

  it('blocks more than 30 emails from the same IP regardless of recipient', async () => {
    for (let i = 0; i < 30; i++) {
      const res = makeRes();
      // Different recipient each loop so the recipient cap doesn't fire first.
      await handler(
        makeReq({
          body: {
            email: `user${i}@example.com`,
            replyContent: 'hi',
          },
        }),
        res,
      );
      expect(res.statusCode).toBe(200);
    }
    const blocked = makeRes();
    await handler(
      makeReq({
        body: {
          email: 'user-final@example.com',
          replyContent: 'hi',
        },
      }),
      blocked,
    );
    expect(blocked.statusCode).toBe(429);
    expect(blocked.body.reason).toBe('rate_limit_ip');
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

  it('calls Resend with html-escaped body', async () => {
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
    expect(sentBody.html).not.toContain('<script>');
    expect(sentBody.html).toContain('&lt;script&gt;');
    expect(sentBody.html).toContain('&lt;img onerror=x&gt;');
    // viewUrl uses APP_BASE_URL, not request-supplied origin
    expect(sentBody.html).toContain('https://problem-solver.app/#/past-questions?code=AB12');
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

// ---------------------------------------------------------------------------
// IP extraction — S3.2 round 1: leftmost XFF is attacker-controlled on Vercel
// (Vercel APPENDS rather than replaces). Use rightmost XFF / x-vercel-XFF.
// ---------------------------------------------------------------------------

describe('client IP extraction (XFF spoofing defense)', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_fake_test_key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 'm' }),
        text: async () => '',
      }),
    );
  });

  it('uses x-vercel-forwarded-for when present (most trustworthy)', async () => {
    // 30 requests from real IP "10.0.0.1" should hit the IP cap regardless
    // of the spoofed leftmost x-forwarded-for value.
    for (let i = 0; i < 30; i++) {
      const res = makeRes();
      await handler(
        {
          method: 'POST',
          headers: {
            origin: 'https://problem-solver.app',
            // Attacker rotates leftmost XFF — should NOT change bucket.
            'x-forwarded-for': `198.51.100.${i}, 10.0.0.1`,
            'x-vercel-forwarded-for': '10.0.0.1',
          },
          body: { email: `u${i}@x.co`, replyContent: 'hi' },
          socket: { remoteAddress: '10.0.0.1' },
        },
        res,
      );
      expect(res.statusCode).toBe(200);
    }
    const blocked = makeRes();
    await handler(
      {
        method: 'POST',
        headers: {
          origin: 'https://problem-solver.app',
          'x-forwarded-for': '198.51.100.250, 10.0.0.1',
          'x-vercel-forwarded-for': '10.0.0.1',
        },
        body: { email: 'last@x.co', replyContent: 'hi' },
        socket: { remoteAddress: '10.0.0.1' },
      },
      blocked,
    );
    expect(blocked.statusCode).toBe(429);
    expect(blocked.body.reason).toBe('rate_limit_ip');
  });

  it('falls back to RIGHTMOST x-forwarded-for when x-vercel-forwarded-for is absent', async () => {
    // Same attack: rotate leftmost XFF, real client always rightmost.
    for (let i = 0; i < 30; i++) {
      const res = makeRes();
      await handler(
        {
          method: 'POST',
          headers: {
            origin: 'https://problem-solver.app',
            'x-forwarded-for': `198.51.100.${i}, 10.0.0.7`,
          },
          body: { email: `q${i}@x.co`, replyContent: 'hi' },
          socket: { remoteAddress: '10.0.0.7' },
        },
        res,
      );
      expect(res.statusCode).toBe(200);
    }
    const blocked = makeRes();
    await handler(
      {
        method: 'POST',
        headers: {
          origin: 'https://problem-solver.app',
          'x-forwarded-for': '198.51.100.99, 10.0.0.7',
        },
        body: { email: 'q-final@x.co', replyContent: 'hi' },
        socket: { remoteAddress: '10.0.0.7' },
      },
      blocked,
    );
    expect(blocked.statusCode).toBe(429);
    expect(blocked.body.reason).toBe('rate_limit_ip');
  });
});
