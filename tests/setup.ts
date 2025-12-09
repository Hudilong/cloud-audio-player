import '@testing-library/jest-dom';

if (!global.ResizeObserver) {
  class ResizeObserver {
    observe() {}

    unobserve() {}

    disconnect() {}
  }
  // @ts-ignore - jsdom lacks ResizeObserver
  global.ResizeObserver = ResizeObserver;
}
