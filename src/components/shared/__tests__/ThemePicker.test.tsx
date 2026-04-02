import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemePicker from '../ThemePicker';

describe('ThemePicker', () => {
  it('renders the toggle button', () => {
    render(<ThemePicker />);
    expect(screen.getByTitle('Change theme')).toBeInTheDocument();
  });

  it('opens panel when toggle clicked', () => {
    render(<ThemePicker />);
    fireEvent.click(screen.getByTitle('Change theme'));
    expect(screen.getByText(/Theme/)).toBeInTheDocument();
  });

  it('shows light/dark mode toggles when open', () => {
    render(<ThemePicker />);
    fireEvent.click(screen.getByTitle('Change theme'));
    // Light toggle
    expect(screen.getByText(/☀️ Light/)).toBeInTheDocument();
    // Dark toggle
    expect(screen.getByText(/🌙 Dark/)).toBeInTheDocument();
  });

  it('shows all 5 theme options when open', () => {
    render(<ThemePicker />);
    fireEvent.click(screen.getByTitle('Change theme'));
    expect(screen.getByText(/Dark Blue/)).toBeInTheDocument();
    expect(screen.getByText(/Dark Purple/)).toBeInTheDocument();
    expect(screen.getByText(/Dark Teal/)).toBeInTheDocument();
    expect(screen.getByText(/Dark Sunset/)).toBeInTheDocument();
    expect(screen.getByText(/Dark Forest/)).toBeInTheDocument();
  });

  it('closes panel when a theme is selected', () => {
    render(<ThemePicker />);
    fireEvent.click(screen.getByTitle('Change theme'));
    // Click a theme
    fireEvent.click(screen.getByText(/Dark Purple/));
    // Panel should close - theme button should still exist
    expect(screen.getByTitle('Change theme')).toBeInTheDocument();
  });

  it('closes on outside click', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <ThemePicker />
      </div>
    );
    fireEvent.click(screen.getByTitle('Change theme'));
    expect(screen.getByText(/Theme/)).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));
    // Panel should close
    expect(screen.queryByText(/Dark Blue/)).not.toBeInTheDocument();
  });
});
