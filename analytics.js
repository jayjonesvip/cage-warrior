(() => {
  'use strict';

  function createTracker(send) {
    return (eventName, parameters = {}) => {
      if (typeof eventName !== 'string' || !/^[a-z][a-z0-9_]{0,39}$/.test(eventName)) return false;
      const clean = {};
      for (const [key, value] of Object.entries(parameters || {})) {
        if (!/^[a-z][a-z0-9_]{0,39}$/.test(key)) continue;
        if (typeof value === 'string') clean[key] = value.slice(0, 100);
        else if (typeof value === 'number' && Number.isFinite(value)) clean[key] = value;
        else if (typeof value === 'boolean') clean[key] = value;
      }
      try {
        send(eventName, clean);
        return true;
      } catch (_) {
        return false;
      }
    };
  }

  const track = createTracker((eventName, parameters) => {
    if (typeof globalThis.gtag === 'function') globalThis.gtag('event', eventName, parameters);
  });

  globalThis.CAGE_ANALYTICS = Object.freeze({ createTracker, track });
})();
