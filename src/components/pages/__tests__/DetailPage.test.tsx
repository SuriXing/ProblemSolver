import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../test/mocks/i18n';
import '../../../test/mocks/supabase';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

let mockAccessCode: string | undefined = 'DETAIL1';
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ accessCode: mockAccessCode }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../layout/Layout', () => ({
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));
vi.mock('../../../utils/environmentLabel', () => ({
  isLocalRuntime: () => false,
  withLocalSuffix: (l: string) => l,
}));

const mockCheckAccessCode = vi.fn();
const mockRetrievePostData = vi.fn();
const mockStorePostData = vi.fn();
vi.mock('../../../utils/storage-system', () => ({
  checkAccessCode: (...args: any[]) => mockCheckAccessCode(...args),
  retrievePostData: (...args: any[]) => mockRetrievePostData(...args),
  storePostData: (...args: any[]) => mockStorePostData(...args),
}));

vi.mock('../../../utils/helpers', () => ({
  getTimeAgo: () => '2 hours ago',
}));

// Mock useTypeSafeTranslation with a stable t to avoid infinite re-renders
// The t function returns defaultValue if present (matching i18n mock behavior), otherwise the key
const stableT = (key: string, opts?: any) => {
  if (opts && opts.defaultValue) return opts.defaultValue;
  return key;
};
const stableI18n = { language: 'en', changeLanguage: vi.fn(), reloadResources: vi.fn() };
vi.mock('../../../utils/translationHelper', () => ({
  useTypeSafeTranslation: () => ({ t: stableT, i18n: stableI18n }),
}));

import DetailPage from '../DetailPage';

const samplePost = {
  id: 'post-1',
  content: 'I need help with something',
  timestamp: new Date().toISOString(),
  createdAt: Date.now(),
  selectedTags: ['Anxiety'],
  tags: ['Anxiety'],
  replies: [],
};

describe('DetailPage', () => {
  beforeEach(() => {
    mockAccessCode = 'DETAIL1';
    mockNavigate.mockClear();
    mockCheckAccessCode.mockReset();
    mockRetrievePostData.mockReset();
    mockStorePostData.mockReset();
  });

  it('shows loading state initially', () => {
    mockCheckAccessCode.mockReturnValue(true);
    mockRetrievePostData.mockReturnValue(samplePost);
    render(<MemoryRouter><DetailPage /></MemoryRouter>);
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('starts in loading state with valid access code before setTimeout fires', () => {
    mockCheckAccessCode.mockReturnValue(true);
    mockRetrievePostData.mockReturnValue(samplePost);
    render(<MemoryRouter><DetailPage /></MemoryRouter>);
    // Before setTimeout(1000) fires, component shows loading spinner
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('shows error for invalid access code', async () => {
    mockCheckAccessCode.mockReturnValue(false);
    render(<MemoryRouter><DetailPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('invalidAccessCode')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows error when post data not found', async () => {
    mockCheckAccessCode.mockReturnValue(true);
    mockRetrievePostData.mockReturnValue(null);
    render(<MemoryRouter><DetailPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('errorRetrievingData')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders reply textarea after loading', async () => {
    mockCheckAccessCode.mockReturnValue(true);
    mockRetrievePostData.mockReturnValue(samplePost);
    render(<MemoryRouter><DetailPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('writeYourResponse')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders reaction buttons after loading', async () => {
    mockCheckAccessCode.mockReturnValue(true);
    mockRetrievePostData.mockReturnValue(samplePost);
    render(<MemoryRouter><DetailPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByTitle('reactionSmile')).toBeInTheDocument();
      expect(screen.getByTitle('reactionHeart')).toBeInTheDocument();
      expect(screen.getByTitle('reactionThumbsUp')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('submits a reply and shows success message', async () => {
    mockCheckAccessCode.mockReturnValue(true);
    mockRetrievePostData.mockReturnValue({ ...samplePost });
    render(<MemoryRouter><DetailPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('writeYourResponse')).toBeInTheDocument();
    }, { timeout: 3000 });

    const textarea = screen.getByPlaceholderText('writeYourResponse');
    fireEvent.change(textarea, { target: { value: 'My reply text' } });

    const submitBtn = screen.getByText('sendResponse');
    fireEvent.click(submitBtn);

    expect(screen.getByText('replySuccess')).toBeInTheDocument();
    expect(mockStorePostData).toHaveBeenCalled();
  });

  it('shows no replies message when post has no replies', async () => {
    mockCheckAccessCode.mockReturnValue(true);
    mockRetrievePostData.mockReturnValue({ ...samplePost, replies: [] });
    render(<MemoryRouter><DetailPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('noRepliesYet')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows return home link in error state', async () => {
    mockCheckAccessCode.mockReturnValue(false);
    render(<MemoryRouter><DetailPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('returnHome')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows no access code error when none provided', () => {
    mockAccessCode = undefined;
    render(<MemoryRouter><DetailPage /></MemoryRouter>);
    expect(screen.getByText('noAccessCodeProvided')).toBeInTheDocument();
  });
});
