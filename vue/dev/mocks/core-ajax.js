/**
 * Mock of Moodle core/ajax for standalone development.
 * Logs calls to console instead of making real AJAX requests.
 */
export default {
  call(requests) {
    return Promise.all(
      requests.map((req) => {
        console.log(
          `[mock ajax] ${req.methodname}`,
          req.args || "(no args)"
        );
        // Return empty/fallback data so the app doesn't break.
        return Promise.resolve(req.methodname === "core_get_component_strings" ? [] : { success: false, data: "{}" });
      })
    );
  },
};
