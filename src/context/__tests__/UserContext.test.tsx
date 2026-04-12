import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { UserProvider, useUser } from '../UserContext';

const testUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  isAnonymous: false,
  language: 'en',
};

describe('UserProvider', () => {
  it('renders children', () => {
    render(
      <UserProvider>
        <div data-testid="child">Hello</div>
      </UserProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('provides null user by default', () => {
    const { result } = renderHook(() => useUser(), {
      wrapper: ({ children }) => <UserProvider>{children}</UserProvider>,
    });
    expect(result.current.user).toBeNull();
  });
});

describe('useUser', () => {
  it('throws when used outside UserProvider', () => {
    // Suppress console.error from React during the expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useUser())).toThrow(
      'useUser must be used within a UserProvider'
    );
    spy.mockRestore();
  });

  describe('setUser', () => {
    it('sets a user', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserProvider>{children}</UserProvider>
      );
      const { result } = renderHook(() => useUser(), { wrapper });

      act(() => {
        result.current.setUser(testUser);
      });

      expect(result.current.user).toEqual(testUser);
    });

    it('can set user back to null', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserProvider>{children}</UserProvider>
      );
      const { result } = renderHook(() => useUser(), { wrapper });

      act(() => {
        result.current.setUser(testUser);
      });
      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('merges partial updates into existing user', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserProvider>{children}</UserProvider>
      );
      const { result } = renderHook(() => useUser(), { wrapper });

      act(() => {
        result.current.setUser(testUser);
      });
      act(() => {
        result.current.updateUser({ name: 'Updated Name', language: 'ja' });
      });

      expect(result.current.user).toEqual({
        ...testUser,
        name: 'Updated Name',
        language: 'ja',
      });
    });

    it('is a no-op when user is null', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserProvider>{children}</UserProvider>
      );
      const { result } = renderHook(() => useUser(), { wrapper });

      // user is null by default
      act(() => {
        result.current.updateUser({ name: 'Should not apply' });
      });

      expect(result.current.user).toBeNull();
    });

    it('preserves fields not included in the update', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserProvider>{children}</UserProvider>
      );
      const { result } = renderHook(() => useUser(), { wrapper });

      act(() => {
        result.current.setUser(testUser);
      });
      act(() => {
        result.current.updateUser({ email: 'new@example.com' });
      });

      expect(result.current.user!.name).toBe(testUser.name);
      expect(result.current.user!.id).toBe(testUser.id);
      expect(result.current.user!.email).toBe('new@example.com');
    });
  });
});
