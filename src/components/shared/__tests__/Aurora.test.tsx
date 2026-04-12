import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// Mock ogl since it needs WebGL
const mockCanvas = document.createElement('canvas');
vi.mock('ogl', () => ({
  Renderer: vi.fn().mockImplementation(() => ({
    gl: {
      clearColor: vi.fn(),
      enable: vi.fn(),
      blendFunc: vi.fn(),
      canvas: mockCanvas,
      ONE: 1,
      ONE_MINUS_SRC_ALPHA: 771,
      BLEND: 3042,
      getExtension: vi.fn().mockReturnValue({ loseContext: vi.fn() }),
    },
    setSize: vi.fn(),
    render: vi.fn(),
  })),
  Program: vi.fn().mockImplementation(() => ({
    uniforms: {
      uTime: { value: 0 },
      uAmplitude: { value: 1 },
      uColorStops: { value: [] },
      uResolution: { value: [0, 0] },
      uBlend: { value: 0.5 },
    },
  })),
  Mesh: vi.fn(),
  Color: vi.fn().mockImplementation(() => ({ r: 0, g: 0, b: 0 })),
  Triangle: vi.fn().mockImplementation(() => ({
    attributes: {},
  })),
}));

import Aurora from '../Aurora';

describe('Aurora', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  it('renders a container div', () => {
    const { container } = render(<Aurora />);
    const div = container.firstChild as HTMLElement;
    expect(div).toBeTruthy();
    expect(div.style.position).toBe('fixed');
    expect(div.style.pointerEvents).toBe('none');
  });

  // Note: Prop-driven rendering (colorStops, amplitude, blend) cannot be meaningfully
  // unit-tested because Aurora renders to a WebGL canvas via OGL. The mount test above
  // (renders a container div) verifies component lifecycle works; actual visual output
  // is covered by E2E tests and manual verification.

  it('cleans up on unmount', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const removeEventSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<Aurora />);
    unmount();

    expect(cancelSpy).toHaveBeenCalled();
    expect(removeEventSpy).toHaveBeenCalled();
  });
});
