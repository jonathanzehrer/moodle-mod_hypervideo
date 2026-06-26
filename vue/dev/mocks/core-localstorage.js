/**
 * Mock of Moodle core/localstorage for standalone development.
 * Uses the browser's localStorage directly.
 */
export default {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      // storage full or unavailable — silently ignore
    }
  },
};
