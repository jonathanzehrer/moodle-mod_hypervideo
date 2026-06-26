// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * @package    mod_hypervideo
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// eslint-disable-next-line camelcase, no-undef
__webpack_public_path__ = M.cfg.wwwroot + "/mod/hypervideo/amd/build/";

import { createApp } from "vue";
import { createStore } from "./store";
import { i18n } from "./util/i18n";
import Communication from "./scripts/communication";

/**
 * Compute the variant number (1-3) from hypervideo id and user id.
 */
function computeVariant(hypervideoid, userid) {
  return ((Number(hypervideoid) || 0) + (Number(userid) || 0)) % 3;
}

export const init = async (
  coursemoduleid,
  contextid,
  courseid,
  hypervideoid,
  fullPluginName,
  url,
  title,
  initialData = null,
  userid = 0,
) => {
  Communication.setPluginName(fullPluginName);

  const variant = computeVariant(hypervideoid, userid);

  // Dynamically load the variant component.
  let App;
  if (variant === 0) {
    App = (await import("./AppVariant1.vue")).default;
  } else if (variant === 1) {
    App = (await import("./AppVariant2.vue")).default;
  } else {
    App = (await import("./AppVariant3.vue")).default;
  }

  const store = createStore({
    pluginName: fullPluginName,
    courseModuleID: Number(coursemoduleid),
    contextID: Number(contextid),
    courseid: Number(courseid),
    hypervideoid: Number(hypervideoid),
    userid: Number(userid),
    url: url,
    title: title,
    chapters: initialData && initialData.chapters ? initialData.chapters : [],
  });

  let lang;

  // Preferred: use pre-loaded strings from PHP (no AJAX round-trip).
  if (initialData && initialData.i18nStrings) {
    lang = initialData.lang || "en";
    store.commit("setStrings", initialData.i18nStrings);
  } else {
    // Fallback: load strings via AJAX.
    lang = document.documentElement.lang.replace(/-/g, "_");
    await store.dispatch("loadComponentStrings", lang);
  }

  i18n.global.setLocaleMessage(lang, store.state.strings);
  i18n.global.locale = lang;

  const app = createApp(App);
  app.use(store);
  app.use(i18n);
  app.mount("#app");
};

export default { init };
