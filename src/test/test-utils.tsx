import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavigationLockProvider } from '../context/NavigationLockContext';

// Wrapper that provides Router + NavigationLock context for component tests.
// NavigationLockProvider calls useNavigate, so it must be nested INSIDE the
// router. Without it, page components that call useExitNavigate throw
// "must be used within a NavigationLockProvider" at render time.
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <NavigationLockProvider>{children}</NavigationLockProvider>
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
        <NavigationLockProvider>{children}</NavigationLockProvider>
      </MemoryRouter>
    ),
    ...options,
  });
}

export { renderWithRouter, AllProviders };
export { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
