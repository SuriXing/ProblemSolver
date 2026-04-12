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

  it('accepts custom colorStops', () => {
    const { container } = render(<Aurora colorStops={['#ff0000', '#00ff00', '#0000ff']} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('accepts amplitude and blend props', () => {
    const { container } = render(<Aurora amplitude={2.0} blend={0.8} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('cleans up on unmount', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const removeEventSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<Aurora />);
    unmount();

    expect(cancelSpy).toHaveBeenCalled();
    expect(removeEventSpy).toHaveBeenCalled();
  });
});
