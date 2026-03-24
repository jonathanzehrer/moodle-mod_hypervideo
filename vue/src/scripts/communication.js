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

import ajax from "core/ajax";

export default class Communication {
  static setPluginName(name) {
    Communication.fullName = name;
  }

  static webservice(method, param = {}) {
    if (typeof Communication.fullName !== "string") {
      throw new Error("No plugin name given at communication class.");
    }
    return new Promise((resolve, reject) => {
      ajax.call([
        {
          methodname: `${Communication.fullName}_${method}`,
          args: param ? param : {},
          timeout: 3000,
          done: function (data) {
            return resolve(data);
          },
          fail: function (error) {
            console.error(
              "Error at Webservice: " + Communication.fullName + "_" + method,
              error,
            );
            return reject(error);
          },
        },
      ]);
    });
  }
}
