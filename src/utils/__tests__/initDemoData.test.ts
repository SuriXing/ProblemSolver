import '../../test/mocks/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock StorageSystem before importing initDemoData
vi.mock('../StorageSystem', () => {
  const mockStoreData = vi.fn().mockReturnValue(true);
  const mockCheckAccessCode = vi.fn().mockResolvedValue(false);
  return {
    default: {
      storeData: mockStoreData,
      checkAccessCode: mockCheckAccessCode,
      retrieveData: vi.fn(),
      clearAllData: vi.fn(),
      generateAccessCode: vi.fn(),
    },
    checkAccessCode: mockCheckAccessCode,
    generateAccessCode: vi.fn(),
  };
});

import initDemoData from '../initDemoData';
import StorageSystem from '../StorageSystem';

describe('initDemoData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores both demo posts when neither exists', () => {
    (StorageSystem.checkAccessCode as any).mockReturnValue(false);
    initDemoData();
    expect(StorageSystem.storeData).toHaveBeenCalledTimes(2);
    expect(StorageSystem.storeData).toHaveBeenCalledWith(
      'TSZT-VVSM-8F8Y',
      expect.objectContaining({ accessCode: 'TSZT-VVSM-8F8Y' })
    );
    expect(StorageSystem.storeData).toHaveBeenCalledWith(
      'J23B-F42A-LCRZ',
      expect.objectContaining({ accessCode: 'J23B-F42A-LCRZ' })
    );
  });

  it('skips storing when demo data already exists', () => {
    (StorageSystem.checkAccessCode as any).mockReturnValue(true);
    initDemoData();
    expect(StorageSystem.storeData).not.toHaveBeenCalled();
  });

  it('stores only the second post when first already exists', () => {
    (StorageSystem.checkAccessCode as any)
      .mockReturnValueOnce(true)   // TSZT-VVSM-8F8Y exists
      .mockReturnValueOnce(false); // J23B-F42A-LCRZ does not
    initDemoData();
    expect(StorageSystem.storeData).toHaveBeenCalledTimes(1);
    expect(StorageSystem.storeData).toHaveBeenCalledWith(
      'J23B-F42A-LCRZ',
      expect.objectContaining({ accessCode: 'J23B-F42A-LCRZ' })
    );
  });

  it('stores demo posts with correct structure', () => {
    (StorageSystem.checkAccessCode as any).mockReturnValue(false);
    initDemoData();

    const firstCall = (StorageSystem.storeData as any).mock.calls[0][1];
    expect(firstCall).toHaveProperty('userId');
    expect(firstCall).toHaveProperty('confessionText');
    expect(firstCall).toHaveProperty('selectedTags');
    expect(firstCall).toHaveProperty('replies');
    expect(Array.isArray(firstCall.replies)).toBe(true);
    expect(firstCall.replies.length).toBeGreaterThan(0);
  });
});
