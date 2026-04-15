import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../test/mocks/supabase';
import '../../test/mocks/i18n';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { supabaseMock, createQueryBuilder } from '../../test/mocks/supabase';

vi.mock('../../utils/supabaseUtils', () => ({
  getSupabaseUrl: () => 'https://test.supabase.co',
  getSupabaseAnonKey: () => 'test-key',
}));

import SupabaseTest from '../SupabaseTest';

describe('SupabaseTest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders test form', () => {
    render(<SupabaseTest />);
    expect(screen.getByText('Supabase Connection Test')).toBeInTheDocument();
    expect(screen.getByText('Test Connection')).toBeInTheDocument();
    expect(screen.getByText('Test Insert')).toBeInTheDocument();
  });

  it('shows URL info', () => {
    render(<SupabaseTest />);
    expect(screen.getByText(/test\.supabase\.co/)).toBeInTheDocument();
  });

  it('has title and content inputs', () => {
    render(<SupabaseTest />);
    expect(screen.getByDisplayValue('Test Post')).toBeInTheDocument();
    expect(screen.getByDisplayValue('This is a test post')).toBeInTheDocument();
  });

  it('updates title input on change', () => {
    render(<SupabaseTest />);
    const titleInput = screen.getByDisplayValue('Test Post');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    expect(screen.getByDisplayValue('New Title')).toBeInTheDocument();
  });

  it('Test Connection success shows success message', async () => {
    supabaseMock.from = vi.fn().mockReturnValue(createQueryBuilder({ data: null, error: null, count: 0 }));

    render(<SupabaseTest />);
    fireEvent.click(screen.getByText('Test Connection'));

    await waitFor(() => {
      expect(screen.getByText(/Connection successful/)).toBeInTheDocument();
    });
  });

  it('Test Connection error shows failure message', async () => {
    supabaseMock.from = vi.fn().mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'Connection refused', code: 'X' }, count: null })
    );

    render(<SupabaseTest />);
    fireEvent.click(screen.getByText('Test Connection'));

    await waitFor(() => {
      expect(screen.getByText(/Connection test failed: Connection refused/)).toBeInTheDocument();
    });
  });

  it('Test Insert success displays new post ID', async () => {
    supabaseMock.from = vi.fn().mockReturnValue(
      createQueryBuilder({ data: { id: 'new-post-123' }, error: null })
    );

    render(<SupabaseTest />);
    fireEvent.click(screen.getByText('Test Insert'));

    await waitFor(() => {
      expect(screen.getByText(/Insert successful.*new-post-123/)).toBeInTheDocument();
    });
  });

  it('Test Insert error displays failure message', async () => {
    supabaseMock.from = vi.fn().mockReturnValue(
      createQueryBuilder({
        data: null,
        error: { message: 'Column missing', code: '42703', details: null },
      })
    );

    render(<SupabaseTest />);
    fireEvent.click(screen.getByText('Test Insert'));

    await waitFor(() => {
      expect(screen.getByText(/Insert test failed: Column missing/)).toBeInTheDocument();
    });
  });
});
