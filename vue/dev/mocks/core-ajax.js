/**
 * Mock of Moodle core/ajax for standalone development.
 * Logs calls to console instead of making real AJAX requests.
 */
export default {
  /**
   * Mirrors Moodle's core/ajax.call(requests) API:
   * takes an array of request objects, returns an array of Promises.
   */
  call(requests) {
    return requests.map((req) => {
      console.log(
        `[mock ajax] ${req.methodname}`,
        req.args || "(no args)",
      );
      // Return empty/fallback data so the app doesn't break.
      return Promise.resolve(
        req.methodname === "core_get_component_strings"
          ? []
          : { success: false, data: "{}" },
      );
    });
  },
};
