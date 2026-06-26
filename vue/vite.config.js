import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

const resolve = (p) => path.resolve(__dirname, p);

// Mock for all Moodle AMD modules — returns the core-ajax mock.
const mockAjax = resolve("dev/mocks/core-ajax.js");
const mockStorage = resolve("dev/mocks/core-localstorage.js");

export default defineConfig({
  root: resolve("."),
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve("src"),
      "vue": "vue/dist/vue.esm-bundler.js",

      // Redirect all Moodle AMD imports to local mocks.
      "core/ajax": mockAjax,
      "core/str": mockAjax,
      "core/localstorage": mockStorage,
      "core/notification": mockAjax,
      "core/modal_factory": mockAjax,
      "core/modal_events": mockAjax,
      "core/fragment": mockAjax,
      "core/pubsub": mockAjax,
      "jquery": mockAjax,
    },
  },
  define: {
    // main.js has __webpack_public_path__ = M.cfg.wwwroot + ...;
    // Replace with a harmless no-op so it doesn't throw.
    __webpack_public_path__: "window.__unused_pp__",
  },
  server: {
    open: true, // auto-open browser
    fs: {
      // Allow serving files from the entire project.
      allow: [resolve(".")],
    },
  },
});