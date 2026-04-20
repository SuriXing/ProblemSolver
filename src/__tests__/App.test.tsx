import { describe, it, expect, vi } from 'vitest';
import '../test/mocks/i18n';
import { render, screen } from '@testing-library/react';

// Mock all page components to isolate App routing logic
vi.mock('../components/pages/HomePage', () => ({ default: () => <div>HomePage</div> }));
vi.mock('../components/pages/HelpPage', () => ({ default: () => <div>HelpPage</div> }));
vi.mock('../components/pages/ConfessionPage', () => ({ default: () => <div>ConfessionPage</div> }));
vi.mock('../components/pages/SuccessPage', () => ({ default: () => <div>SuccessPage</div> }));
vi.mock('../components/pages/HelpSuccessPage', () => ({ default: () => <div>HelpSuccessPage</div> }));
vi.mock('../components/pages/PastQuestionsPage', () => ({ default: () => <div>PastQuestionsPage</div> }));
vi.mock('../components/pages/TopicDetailPage', () => ({ default: () => <div>TopicDetailPage</div> }));
vi.mock('../components/pages/SharePage', () => ({ default: () => <div>SharePage</div> }));
vi.mock('../components/pages/HelpDetailPage', () => ({ default: () => <div>HelpDetailPage</div> }));
vi.mock('../components/pages/NotFoundPage', () => ({ default: () => <div>NotFoundPage</div> }));
vi.mock('../components/pages/LoadingPage', () => ({ default: () => <div>LoadingPage</div> }));
vi.mock('../components/pages/AdminLoginPage', () => ({ default: () => <div>AdminLoginPage</div> }));
vi.mock('../components/pages/AdminDashboardPage', () => ({ default: () => <div>AdminDashboardPage</div> }));
vi.mock('../components/ProtectedRoute', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('../components/SupabaseTest', () => ({ default: () => <div>SupabaseTest</div> }));
vi.mock('../components/EnvDebug', () => ({ default: () => <div>EnvDebug</div> }));
vi.mock('../components/DebugMenu', () => ({ default: () => null }));
vi.mock('../context/TranslationContext', () => ({
  TranslationProvider: ({ children }: any) => <div data-testid="translation-provider">{children}</div>,
}));
vi.mock('../utils/environment', () => ({
  IS_PROD: true,
  IS_DEV: false,
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  NODE_ENV: 'test',
}));
vi.mock('../utils/supabaseUtils', () => ({
  getSupabaseUrl: () => 'https://test.supabase.co',
  getSupabaseAnonKey: () => 'test-anon-key',
}));

import AppWrapper from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<AppWrapper />);
    // HashRouter starts at "/" which renders HomePage
    expect(screen.getByText('HomePage')).toBeInTheDocument();
  });

  it('wraps the routed content in TranslationProvider', () => {
    render(<AppWrapper />);
    const provider = screen.getByTestId('translation-provider');
    // The provider must wrap the rendered route content — HomePage must be a descendant
    expect(provider).toContainElement(screen.getByText('HomePage'));
  });
});
