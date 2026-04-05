import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Wrapper that provides Router context for component tests
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      {children}
    </MemoryRouter>
  );
}

function renderWithRouter(
  ui: ReactElement,
  { route = '/', ...options }: RenderOptions & { route?: string } = {}
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[route]}>
        {children}
      </MemoryRouter>
    ),
    ...options,
  });
}

export { renderWithRouter, AllProviders };
export { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
