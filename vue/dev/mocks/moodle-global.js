/**
 * Mock of the Moodle M.cfg global for standalone development.
 * Provides a fake wwwroot so __webpack_public_path__ doesn't throw.
 */
window.M = {
  cfg: {
    wwwroot: "",
  },
};
