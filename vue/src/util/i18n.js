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
 * Vue-i18n configuration for mod_hypervideo.
 *
 * @package    mod_hypervideo
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import { createI18n } from "vue-i18n";

// Resolve dot-separated keys by converting dots to underscores,
// matching the key transformation applied in view.php.
const messageResolver = (obj, path) => {
  const key = path.replace(/\./g, "_");
  return obj[key];
};

export const i18n = createI18n({
  legacy: true,
  locale: "en",
  fallbackLocale: "en",
  messages: {},
  silentTranslationWarn: true,
  globalInjection: true,
  messageResolver,
});
