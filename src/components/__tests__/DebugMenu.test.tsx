import { describe, it, expect, vi } from 'vitest';
import '../../test/mocks/i18n';
import '../../test/mocks/supabase';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../context/TranslationContext', () => ({
  useTranslationContext: () => ({
    changeLanguage: vi.fn(),
    getCurrentLanguage: () => 'en',
    currentLanguage: 'en',
  }),
}));

vi.mock('../../services/database.service', () => ({
  DatabaseService: { getPostByAccessCode: vi.fn() },
  generateAccessCode: vi.fn().mockResolvedValue('TESTCODE'),
}));

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

  it('renders debug button', () => {
    render(
      <MemoryRouter>
        <DebugMenu {...defaultProps} />
      </MemoryRouter>
    );
    expect(screen.getByText('debug')).toBeInTheDocument();
  });

  it('opens drawer when debug button clicked', () => {
    render(
      <MemoryRouter>
        <DebugMenu {...defaultProps} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('debug'));
    expect(screen.getByText('debugMenu')).toBeInTheDocument();
  });
});
