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

import { createStore as vuexCreateStore } from "vuex";
import moodleAjax from "core/ajax";
import moodleStorage from "core/localstorage";

export function createStore(initialState) {
  return vuexCreateStore({
    state() {
      return {
        pluginName: initialState.pluginName || "",
        courseModuleID: initialState.courseModuleID || 0,
        contextID: initialState.contextID || 0,
        courseid: initialState.courseid || -1,
        url: initialState.url || "",
        hypervideoid: initialState.hypervideoid || -1,
        title: initialState.title || "",
        chapters: initialState.chapters || [],
        strings: {},
        isModerator: false,
        alert: {
          show: false,
          type: "primary",
          message: "",
        },
      };
    },
    mutations: {
      setCourseid(state, id) {
        state.courseid = id;
      },
      setURL(state, url) {
        state.url = url;
      },
      setHypervideoid(state, val) {
        state.hypervideoid = val;
      },
      setTitle(state, title) {
        state.title = title;
      },
      setChapters(state, chapters) {
        state.chapters = chapters;
      },
      setPluginName(state, name) {
        state.pluginName = name;
      },
      setModerator(state, isModerator) {
        state.isModerator = isModerator;
      },
      setCourseModuleID(state, id) {
        state.courseModuleID = id;
      },
      setContextID(state, id) {
        state.contextID = id;
      },
      setStrings(state, strings) {
        state.strings = strings;
      },
      showAlert(state, [type, message]) {
        const timeout = 3000;
        state.alert.type = type;
        state.alert.message = message;
        state.alert.show = true;
        new Promise((resolve) => setTimeout(resolve, timeout)).then(() => {
          state.alert.show = false;
          state.alert.type = "primary";
          state.alert.message = "";
        });
      },
    },
    getters: {
      getCourseid: (state) => state.courseid,
      getURL: (state) => state.url,
      getHypervideoid: (state) => state.hypervideoid,
      getTitle: (state) => state.title,
      getModeratorStatus: (state) => state.isModerator,
      getAlertType: (state) => `alert-${state.alert.type}`,
      getAlertState: (state) => state.alert.show,
      getAlertMessage: (state) => state.alert.message,
      getContextID: (state) => state.contextID,
      getCourseModuleID: (state) => state.courseModuleID,
      getPluginName: (state) => state.pluginName,
      getCMID: (state) => state.courseModuleID,
    },
    actions: {
      async loadComponentStrings(context, lang) {
        if (!lang) {
          lang = document.documentElement.lang.replace(/-/g, "_");
        }
        const cacheKey = "mod_hypervideo/strings/" + lang;
        const cachedStrings = moodleStorage.get(cacheKey);
        if (cachedStrings) {
          context.commit("setStrings", JSON.parse(cachedStrings));
        } else {
          const request = {
            methodname: "core_get_component_strings",
            args: { component: "mod_hypervideo", lang },
          };
          const loadedStrings = await moodleAjax.call([request])[0];
          const strings = {};
          loadedStrings.forEach((s) => {
            strings[s.stringid.replace(/:/g, "_")] = s.string;
          });
          context.commit("setStrings", strings);
          moodleStorage.set(cacheKey, JSON.stringify(strings));
        }
      },
    },
  });
}

/**
 * Single ajax call to Moodle.
 */
export async function ajax(method, args, store) {
  const request = {
    methodname: method,
    args: Object.assign({ coursemoduleid: store.state.courseModuleID }, args),
  };

  try {
    return await moodleAjax.call([request])[0];
  } catch (e) {
    throw e;
  }
}
