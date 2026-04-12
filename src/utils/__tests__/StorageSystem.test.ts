import '../../test/mocks/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseMock, createQueryBuilder } from '../../test/mocks/supabase';
import StorageSystem, { checkAccessCode, generateAccessCode } from '../StorageSystem';
import type { UserData } from '../StorageSystem';

describe('StorageSystem', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const makeDummyUserData = (overrides: Partial<UserData> = {}): UserData => ({
    userId: 'u1',
    accessCode: 'CODE-1',
    confessionText: 'test',
    selectedTags: ['tag'],
    privacyOption: 'public',
    emailNotification: false,
    email: '',
    timestamp: '2024-01-01T00:00:00Z',
    replies: [],
    views: 0,
    ...overrides,
  });

  describe('storeData', () => {
    it('stores data to localStorage and returns true', () => {
      const result = StorageSystem.storeData('CODE-1', makeDummyUserData());
      expect(result).toBe(true);
      const stored = JSON.parse(localStorage.getItem('problemSolver_userData')!);
      expect(stored).toHaveLength(1);
      expect(stored[0].accessCode).toBe('CODE-1');
    });

    it('returns false when accessCode is empty', () => {
      const result = StorageSystem.storeData('', makeDummyUserData());
      expect(result).toBe(false);
    });

    it('appends to existing data', () => {
      StorageSystem.storeData('CODE-1', makeDummyUserData({ accessCode: 'CODE-1' }));
      StorageSystem.storeData('CODE-2', makeDummyUserData({ accessCode: 'CODE-2' }));
      const stored = JSON.parse(localStorage.getItem('problemSolver_userData')!);
      expect(stored).toHaveLength(2);
    });

    it('adds timestamp if not present', () => {
      const data = makeDummyUserData();
      data.timestamp = '';
      StorageSystem.storeData('CODE-1', data);
      const stored = JSON.parse(localStorage.getItem('problemSolver_userData')!);
      expect(stored[0].timestamp).toBeTruthy();
    });
  });

  describe('retrieveData', () => {
    it('resolves with matching data when found', async () => {
      localStorage.setItem(
        'problemSolver_userData',
        JSON.stringify([makeDummyUserData({ accessCode: 'FIND-ME' })])
      );
      const result = await StorageSystem.retrieveData('FIND-ME');
      expect(result).not.toBeNull();
      expect(result!.accessCode).toBe('FIND-ME');
    });

    it('resolves with null when not found', async () => {
      localStorage.setItem('problemSolver_userData', JSON.stringify([]));
      const result = await StorageSystem.retrieveData('NOPE');
      expect(result).toBeNull();
    });

    it('resolves with null when accessCode is empty', async () => {
      const result = await StorageSystem.retrieveData('');
      expect(result).toBeNull();
    });
  });

  describe('clearAllData', () => {
    it('removes data and re-initializes', () => {
      StorageSystem.storeData('CODE', makeDummyUserData());
      StorageSystem.clearAllData();
      const stored = JSON.parse(localStorage.getItem('problemSolver_userData')!);
      expect(stored).toEqual({});
    });
  });

  describe('checkAccessCode', () => {
    it('returns true when access code exists in supabase', async () => {
      supabaseMock.from.mockReturnValue(
        createQueryBuilder({ data: { id: 1 }, error: null })
      );
      const result = await checkAccessCode('EXISTS');
      expect(result).toBe(true);
    });

    it('returns false when access code does not exist', async () => {
      supabaseMock.from.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'not found', code: 'PGRST116' } })
      );
      const result = await checkAccessCode('NOPE');
      expect(result).toBe(false);
    });

    it('returns false for empty access code', async () => {
      const result = await checkAccessCode('');
      expect(result).toBe(false);
    });
  });

  describe('generateAccessCode', () => {
    it('generates a 6-character alphanumeric code', async () => {
      supabaseMock.from.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'not found' } })
      );
      const code = await generateAccessCode();
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    });
  });

  describe('storeDataSupabase', () => {
    it('upserts data to problems table', async () => {
      supabaseMock.from.mockReturnValue(createQueryBuilder({ data: null, error: null }));
      const result = await StorageSystem.storeDataSupabase('CODE', makeDummyUserData());
      expect(result).toBe(true);
      expect(supabaseMock.from).toHaveBeenCalledWith('problems');
    });

    it('returns false on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      supabaseMock.from.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'fail' } })
      );
      const result = await StorageSystem.storeDataSupabase('CODE', makeDummyUserData());
      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('retrieveDataSupabase', () => {
    it('retrieves and maps data from problems table', async () => {
      supabaseMock.from.mockReturnValue(
        createQueryBuilder({
          data: {
            user_id: 'u1',
            access_code: 'CODE',
            confession_text: 'text',
            selected_tags: ['a'],
            privacy_option: 'public',
            email_notification: false,
            email: '',
            timestamp: '2024-01-01',
            replies: [],
            views: 5,
          },
          error: null,
        })
      );
      const result = await StorageSystem.retrieveDataSupabase('CODE');
      expect(result).toEqual({
        userId: 'u1',
        accessCode: 'CODE',
        confessionText: 'text',
        selectedTags: ['a'],
        privacyOption: 'public',
        emailNotification: false,
        email: '',
        timestamp: '2024-01-01',
        replies: [],
        views: 5,
      });
    });

    it('returns null on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      supabaseMock.from.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'not found' } })
      );
      const result = await StorageSystem.retrieveDataSupabase('NOPE');
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('getAllData', () => {
    it('returns data from supabase when available', async () => {
      const mockData = [makeDummyUserData()];
      supabaseMock.from.mockReturnValue(
        createQueryBuilder({ data: mockData, error: null })
      );
      const result = await StorageSystem.getAllData();
      expect(result).toEqual(mockData);
    });

    it('falls back to localStorage on supabase error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem(
        'problemSolver_userData',
        JSON.stringify([makeDummyUserData()])
      );
      supabaseMock.from.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'fail' } })
      );
      const result = await StorageSystem.getAllData();
      expect(result).toHaveLength(1);
      consoleSpy.mockRestore();
    });

    it('falls back to localStorage when supabase returns empty', async () => {
      localStorage.setItem(
        'problemSolver_userData',
        JSON.stringify([makeDummyUserData()])
      );
      supabaseMock.from.mockReturnValue(
        createQueryBuilder({ data: [], error: null })
      );
      const result = await StorageSystem.getAllData();
      expect(result).toHaveLength(1);
    });
  });

  describe('incrementViewCount', () => {
    it('increments view count in supabase', async () => {
      const builder = createQueryBuilder({
        data: { views: 5, access_code: 'CODE' },
        error: null,
      });
      supabaseMock.from.mockReturnValue(builder);
      await StorageSystem.incrementViewCount('CODE');
      expect(supabaseMock.from).toHaveBeenCalledWith('problems');
    });

    it('falls back to localStorage on fetch error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem(
        'problemSolver_userData',
        JSON.stringify([makeDummyUserData({ accessCode: 'CODE', views: 3 })])
      );
      supabaseMock.from.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'fail' } })
      );
      await StorageSystem.incrementViewCount('CODE');
      const stored = JSON.parse(localStorage.getItem('problemSolver_userData')!);
      expect(stored[0].views).toBe(4);
      consoleSpy.mockRestore();
    });
  });

  describe('addReply', () => {
    it('adds reply in supabase when data exists', async () => {
      const builder = createQueryBuilder({
        data: { replies: [], access_code: 'CODE' },
        error: null,
      });
      supabaseMock.from.mockReturnValue(builder);
      const reply = { replyText: 'hi', replierName: 'User', replyTime: 'now' };
      await StorageSystem.addReply('CODE', reply);
      expect(supabaseMock.from).toHaveBeenCalledWith('problems');
    });

    it('falls back to localStorage on fetch error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem(
        'problemSolver_userData',
        JSON.stringify([makeDummyUserData({ accessCode: 'CODE', replies: [] })])
      );
      supabaseMock.from.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'fail' } })
      );
      const reply = { replyText: 'hi', replierName: 'User', replyTime: 'now' };
      await StorageSystem.addReply('CODE', reply);
      const stored = JSON.parse(localStorage.getItem('problemSolver_userData')!);
      expect(stored[0].replies).toHaveLength(1);
      consoleSpy.mockRestore();
    });
  });
});
