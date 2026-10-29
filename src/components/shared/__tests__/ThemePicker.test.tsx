import { describe, it, expect } from 'vitest';
import '../../../test/mocks/i18n';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemePicker from '../ThemePicker';

describe('ThemePicker', () => {
  it('renders the toggle button', () => {
    render(<ThemePicker />);
    expect(screen.getByTitle('theme.pickerTitle')).toBeInTheDocument();
  });

  it('opens panel when toggle clicked', () => {
    render(<ThemePicker />);
    fireEvent.click(screen.getByTitle('theme.pickerTitle'));
    expect(screen.getByText('theme.sectionTitle')).toBeInTheDocument();
  });

  it('shows light/dark mode toggles when open', () => {
    render(<ThemePicker />);
    fireEvent.click(screen.getByTitle('theme.pickerTitle'));
    // Light toggle
    expect(screen.getByText(/☀️ theme\.light/)).toBeInTheDocument();
    // Dark toggle
    expect(screen.getByText(/🌙 theme\.dark/)).toBeInTheDocument();
  });

  it('shows all 5 theme options when open', () => {
    render(<ThemePicker />);
    fireEvent.click(screen.getByTitle('theme.pickerTitle'));
    expect(screen.getByText('theme.blue')).toBeInTheDocument();
    expect(screen.getByText('theme.purple')).toBeInTheDocument();
    expect(screen.getByText('theme.teal')).toBeInTheDocument();
    expect(screen.getByText('theme.sunset')).toBeInTheDocument();
    expect(screen.getByText('theme.forest')).toBeInTheDocument();
  });

  it('closes panel when a theme is selected', () => {
    render(<ThemePicker />);
    fireEvent.click(screen.getByTitle('theme.pickerTitle'));
    // All theme options visible while open
    expect(screen.getByText('theme.purple')).toBeInTheDocument();
    expect(screen.getByText('theme.blue')).toBeInTheDocument();

    // Click a theme to select and close
    fireEvent.click(screen.getByText('theme.purple'));

    // Theme list options should no longer be visible (panel closed)
    expect(screen.queryByText('theme.teal')).not.toBeInTheDocument();
    expect(screen.queryByText('theme.sunset')).not.toBeInTheDocument();
    expect(screen.queryByText('theme.forest')).not.toBeInTheDocument();
  });

  it('closes on outside click', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <ThemePicker />
      </div>
    );
    fireEvent.click(screen.getByTitle('theme.pickerTitle'));
    expect(screen.getByText('theme.sectionTitle')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));
    // Panel should close
    expect(screen.queryByText('theme.blue')).not.toBeInTheDocument();
  });
});
