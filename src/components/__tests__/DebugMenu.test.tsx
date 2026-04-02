import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../test/mocks/i18n';
import '../../test/mocks/supabase';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockChangeLanguage = vi.fn();
vi.mock('../../context/TranslationContext', () => ({
  useTranslationContext: () => ({
    changeLanguage: mockChangeLanguage,
    getCurrentLanguage: () => 'en',
    currentLanguage: 'en',
  }),
}));

vi.mock('../../services/database.service', () => ({
  DatabaseService: { getPostByAccessCode: vi.fn() },
  generateAccessCode: vi.fn().mockResolvedValue('TESTCODE'),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import DebugMenu from '../DebugMenu';

describe('DebugMenu', () => {
  const defaultProps = {
    showTest: false,
    setShowTest: vi.fn(),
    useDirectClient: false,
    setUseDirectClient: vi.fn(),
    showEnvDebug: false,
    setShowEnvDebug: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders debug trigger button', () => {
    render(
      <MemoryRouter>
        <DebugMenu {...defaultProps} />
      </MemoryRouter>
    );
    expect(screen.getByText('debug')).toBeInTheDocument();
  });

  it('opens drawer with systemSettings card when clicked', () => {
    render(
      <MemoryRouter>
        <DebugMenu {...defaultProps} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('debug'));
    expect(screen.getByText('debugMenu')).toBeInTheDocument();
    expect(screen.getByText('systemSettings')).toBeInTheDocument();
  });

  it('opens drawer and displays translation settings card', () => {
    render(
      <MemoryRouter>
        <DebugMenu {...defaultProps} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('debug'));
    expect(screen.getByText('translationSettings')).toBeInTheDocument();
  });

  it('clicking English language button calls changeLanguage with "en"', () => {
    render(
      <MemoryRouter>
        <DebugMenu {...defaultProps} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('debug'));
    fireEvent.click(screen.getByText('English'));
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
  });

  it('clicking 中文 language button calls changeLanguage with "zh-CN"', () => {
    render(
      <MemoryRouter>
        <DebugMenu {...defaultProps} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('debug'));
    // Antd inserts a space between two-char Chinese button labels ("中 文")
    fireEvent.click(screen.getByRole('button', { name: /中/ }));
    expect(mockChangeLanguage).toHaveBeenCalledWith('zh-CN');
  });

  it('admin login button navigates to /admin/login', () => {
    render(
      <MemoryRouter>
        <DebugMenu {...defaultProps} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('debug'));
    fireEvent.click(screen.getByText('管理员登录'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
  });

  it('displays environment options card', () => {
    render(
      <MemoryRouter>
        <DebugMenu {...defaultProps} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('debug'));
    expect(screen.getByText('environmentOptions')).toBeInTheDocument();
  });
});
