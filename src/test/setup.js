import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock localStorage if missing or incomplete in jsdom
if (typeof window !== "undefined") {
  const store = {};
  const mockStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };

  try {
    if (!window.localStorage || typeof window.localStorage.getItem !== "function") {
      Object.defineProperty(window, "localStorage", {
        value: mockStorage,
        configurable: true,
      });
    }
  } catch {
    // Ignore if already defined
  }
}
