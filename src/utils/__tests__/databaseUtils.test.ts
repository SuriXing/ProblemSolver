import '../../test/mocks/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseMock, createQueryBuilder } from '../../test/mocks/supabase';
import { verifyDatabaseSchema, isDatabaseSetUp } from '../databaseUtils';

describe('databaseUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyDatabaseSchema', () => {
    it('returns success when all checks pass', async () => {
      // posts table exists, access_code column exists, replies table exists
      supabaseMock.from.mockReturnValue(createQueryBuilder({ data: [{ id: 1 }], error: null }));
      supabaseMock.rpc.mockResolvedValue({
        data: ['CHECK (purpose IN (\'need_help\', \'offer_help\'))'],
        error: null,
      });

      const result = await verifyDatabaseSchema();
      expect(result.success).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('reports issue when posts table does not exist', async () => {
      supabaseMock.from.mockReturnValue(
        createQueryBuilder({ data: null, error: { code: '42P01', message: 'table not found' } })
      );

      const result = await verifyDatabaseSchema();
      expect(result.success).toBe(false);
      expect(result.issues).toContain('Posts table does not exist. Please run the SQL setup scripts.');
    });

    it('reports issue for other posts table errors', async () => {
      supabaseMock.from.mockReturnValue(
        createQueryBuilder({ data: null, error: { code: 'OTHER', message: 'some error' } })
      );

      const result = await verifyDatabaseSchema();
      expect(result.success).toBe(false);
      expect(result.issues[0]).toContain('Error checking posts table');
    });

    it('reports missing purpose constraint', async () => {
      supabaseMock.from.mockReturnValue(createQueryBuilder({ data: [{ id: 1 }], error: null }));
      supabaseMock.rpc.mockResolvedValue({ data: null, error: { message: 'rpc error' } });

      const result = await verifyDatabaseSchema();
      expect(result.issues.some((i: string) => i.includes('purpose constraint'))).toBe(true);
    });

    it('handles unexpected errors', async () => {
      supabaseMock.from.mockImplementation(() => { throw new Error('Unexpected'); });

      const result = await verifyDatabaseSchema();
      expect(result.success).toBe(false);
      expect(result.issues[0]).toContain('Unexpected');
    });

    it('handles non-Error thrown values', async () => {
      supabaseMock.from.mockImplementation(() => { throw 'string error'; });

      const result = await verifyDatabaseSchema();
      expect(result.success).toBe(false);
      expect(result.issues).toContain('Unknown error occurred');
    });
  });

  describe('isDatabaseSetUp', () => {
    it('returns true when posts table exists', async () => {
      supabaseMock.from.mockReturnValue(createQueryBuilder({ data: [{ id: 1 }], error: null }));
      expect(await isDatabaseSetUp()).toBe(true);
    });

    it('returns false when posts table does not exist (42P01)', async () => {
      supabaseMock.from.mockReturnValue(
        createQueryBuilder({ data: null, error: { code: '42P01', message: 'not found' } })
      );
      expect(await isDatabaseSetUp()).toBe(false);
    });

    it('returns false on other errors', async () => {
      supabaseMock.from.mockReturnValue(
        createQueryBuilder({ data: null, error: { code: 'OTHER', message: 'fail' } })
      );
      expect(await isDatabaseSetUp()).toBe(false);
    });

    it('returns false when supabase throws', async () => {
      supabaseMock.from.mockImplementation(() => { throw new Error('boom'); });
      expect(await isDatabaseSetUp()).toBe(false);
    });
  });
});
