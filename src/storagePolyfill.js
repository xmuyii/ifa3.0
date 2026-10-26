// Ifatarot was originally built as a Claude.ai artifact, where `window.storage`
// is provided by the platform. Outside claude.ai that object doesn't exist, so
// this polyfill backs the exact same get/set/delete/list interface with the
// browser's own localStorage. No app code had to change.

if (!window.storage) {
  window.storage = {
    async get(key) {
      const raw = localStorage.getItem(key);
      if (raw === null) throw new Error(`No value for key: ${key}`);
      return { key, value: raw, shared: false };
    },
    async set(key, value) {
      localStorage.setItem(key, value);
      return { key, value, shared: false };
    },
    async delete(key) {
      localStorage.removeItem(key);
      return { key, deleted: true, shared: false };
    },
    async list(prefix) {
      const keys = Object.keys(localStorage).filter((k) => !prefix || k.startsWith(prefix));
      return { keys, prefix, shared: false };
    },
  };
}
