import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Layout from '../layout/Layout';
import { act } from 'react-dom/test-utils';

// Mock the useMediaQuery hook if you're using it
jest.mock('../../hooks/useMediaQuery', () => ({
  useMediaQuery: (query: string) => {
    // Mock different responses based on the query
    if (query.includes('max-width: 768px')) {
      return true; // Mobile
    }
    return false; // Desktop
  }
}));

describe('Responsive Layout Tests', () => {
  
  describe('Desktop Layout', () => {
    beforeEach(() => {
      // Set desktop viewport
      Object.defineProperty(window, 'innerWidth', { value: 1366, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
      
      // Trigger a resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
    });
    
    test('renders desktop navigation', () => {
      render(<Layout><div>Test Content</div></Layout>);
      
      // Test desktop navigation is visible
      expect(screen.getByTestId('desktop-nav')).toBeInTheDocument();
      // Test mobile navigation is not visible
      expect(screen.queryByTestId('mobile-nav')).not.toBeInTheDocument();
    });
    
    test('displays sidebar on desktop', () => {
      render(<Layout><div>Test Content</div></Layout>);
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toHaveClass('desktop-sidebar');
    });
  });
  
  describe('Tablet Layout', () => {
    beforeEach(() => {
      // Set tablet viewport
      Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1024, writable: true });
      
      // Trigger a resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
    });
    
    test('renders tablet-specific components', () => {
      render(<Layout><div>Test Content</div></Layout>);
      
      // Check for tablet-specific adaptations
      expect(screen.getByTestId('content-area')).toHaveClass('tablet-content');
    });
  });
  
  describe('Mobile Layout', () => {
    beforeEach(() => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 390, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 844, writable: true });
      
      // Trigger a resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
    });
    
    test('renders mobile navigation', () => {
      render(<Layout><div>Test Content</div></Layout>);
      
      // Test mobile navigation is visible
      expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
      // Test desktop navigation is not visible
      expect(screen.queryByTestId('desktop-nav')).not.toBeInTheDocument();
    });
    
    test('displays hamburger menu on mobile', () => {
      render(<Layout><div>Test Content</div></Layout>);
      
      expect(screen.getByTestId('hamburger-button')).toBeInTheDocument();
    });
    
    test('expands navigation when hamburger is clicked', () => {
      render(<Layout><div>Test Content</div></Layout>);
      
      const hamburgerButton = screen.getByTestId('hamburger-button');
      hamburgerButton.click();
      
      expect(screen.getByTestId('mobile-menu')).toHaveClass('expanded');
    });
  });
  
  describe('Dynamic Resizing', () => {
    test('adapts to viewport changes', () => {
      render(<Layout><div>Test Content</div></Layout>);
      
      // Start with desktop viewport
      Object.defineProperty(window, 'innerWidth', { value: 1366, writable: true });
      window.dispatchEvent(new Event('resize'));
      
      // Should have desktop navigation
      expect(screen.getByTestId('desktop-nav')).toBeInTheDocument();
      
      // Change to mobile viewport
      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 390, writable: true });
        window.dispatchEvent(new Event('resize'));
      });
      
      // Should now have mobile navigation
      expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
    });
  });
});
