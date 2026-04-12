import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../test/mocks/supabase';
import '../../test/mocks/i18n';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { supabaseMock, createQueryBuilder } from '../../test/mocks/supabase';

vi.mock('../../utils/supabaseUtils', () => ({
  getSupabaseUrl: () => 'https://test.supabase.co',
  getSupabaseAnonKey: () => 'test-key',
  getSupabaseServiceRoleKey: () => '',
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

  it('updates title and content inputs', () => {
    render(<SupabaseTest />);
    const titleInput = screen.getByDisplayValue('Test Post');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    expect(screen.getByDisplayValue('New Title')).toBeInTheDocument();
  });
});
