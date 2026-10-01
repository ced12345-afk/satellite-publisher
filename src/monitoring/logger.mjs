export function createLogger(now = () => new Date().toISOString()) {
  const events = [];
  return {
    log(event, detail = {}) { events.push({ at: now(), event, ...detail }); },
    events() { return [...events]; }
  };
}
