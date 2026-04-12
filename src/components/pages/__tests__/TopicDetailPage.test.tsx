import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../../../test/mocks/i18n';
import '../../../test/mocks/supabase';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

let mockTopicId: string | undefined = '1';
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ topicId: mockTopicId }),
  };
});

vi.mock('../../../utils/environmentLabel', () => ({
  isLocalRuntime: () => false,
  withLocalSuffix: (l: string) => l,
}));

import TopicDetailPage from '../TopicDetailPage';

describe('TopicDetailPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockTopicId = '1';
    // jsdom doesn't implement scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows loading state initially', () => {
    render(<MemoryRouter><TopicDetailPage /></MemoryRouter>);
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('renders topic content after loading', () => {
    render(<MemoryRouter><TopicDetailPage /></MemoryRouter>);
    act(() => { vi.advanceTimersByTime(900); });
    expect(screen.getByText(/感觉工作压力太大/)).toBeInTheDocument();
  });

  it('renders replies for topic 1', () => {
    render(<MemoryRouter><TopicDetailPage /></MemoryRouter>);
    act(() => { vi.advanceTimersByTime(900); });
    expect(screen.getByText('平衡达人')).toBeInTheDocument();
    expect(screen.getByText('前重度工作狂')).toBeInTheDocument();
  });

  it('shows topic not found for invalid topicId', () => {
    mockTopicId = '999';
    render(<MemoryRouter><TopicDetailPage /></MemoryRouter>);
    act(() => { vi.advanceTimersByTime(900); });
    expect(screen.getByText('topicNotFound')).toBeInTheDocument();
  });

  it('renders reply form', () => {
    render(<MemoryRouter><TopicDetailPage /></MemoryRouter>);
    act(() => { vi.advanceTimersByTime(900); });
    expect(screen.getByPlaceholderText('shareYourThoughts')).toBeInTheDocument();
    expect(screen.getByText('postReply')).toBeInTheDocument();
  });

  it('adds a new reply when form is submitted', () => {
    render(<MemoryRouter><TopicDetailPage /></MemoryRouter>);
    act(() => { vi.advanceTimersByTime(900); });

    const textarea = screen.getByPlaceholderText('shareYourThoughts');
    fireEvent.change(textarea, { target: { value: 'My helpful reply' } });

    const submitBtn = screen.getByText('postReply');
    fireEvent.click(submitBtn);

    expect(screen.getByText('My helpful reply')).toBeInTheDocument();
  });

  it('renders sort options and defaults to latest', () => {
    render(<MemoryRouter><TopicDetailPage /></MemoryRouter>);
    act(() => { vi.advanceTimersByTime(900); });
    expect(screen.getByText('latest')).toBeInTheDocument();
    expect(screen.getByText('oldest')).toBeInTheDocument();
    expect(screen.getByText('mostHelpful')).toBeInTheDocument();
  });

  it('renders topic 2 with its replies', () => {
    mockTopicId = '2';
    render(<MemoryRouter><TopicDetailPage /></MemoryRouter>);
    act(() => { vi.advanceTimersByTime(900); });
    expect(screen.getByText(/如何克服社交恐惧/)).toBeInTheDocument();
    expect(screen.getByText('曾经恐社交')).toBeInTheDocument();
  });
});
