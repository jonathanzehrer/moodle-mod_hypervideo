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
 * Logging utility for hypervideo user interactions.
 *
 * @package    mod_hypervideo
 * @copyright  2021 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Communication from "./communication";

export default function Logger(courseid, hypervideoid, options) {
  this.courseid = courseid;
  this.hypervideoid = hypervideoid;
  this.url = options.url;

  this.init = function () {
    this.options = Object.assign(
      {
        outputType: 1, // -1: no logging, 0: console.log(), 1: server log
        context: "default-context",
      },
      options,
    );
  };

  /**
   * Adds a message to the log by constructing a log entry.
   */
  this.add = function (action, msg) {
    if (typeof msg === "string") {
      return;
    }
    const time = this.getLogTime();
    const logEntry = {
      utc: time.utc,
      location: {
        host: window.location.host,
        pathname: window.location.href,
        url: this.url,
      },
      context: this.options.context,
      action: action,
      value: msg,
      userAgent: {
        cpu: navigator.oscpu,
        platform: navigator.platform,
        engine: navigator.product,
        browser: navigator.appCodeName,
      },
    };
    this.output(logEntry);
  };

  /**
   * Returns structured time information.
   */
  this.getLogTime = function () {
    const date = new Date();
    const s = date.getSeconds();
    const mi = date.getMinutes();
    const h = date.getHours();
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();

    return {
      utc: date.getTime(),
      date: y + "-" + (m <= 9 ? "0" + m : m) + "-" + (d <= 9 ? "0" + d : d),
      time:
        (h <= 9 ? "0" + h : h) +
        ":" +
        (mi <= 9 ? "0" + mi : mi) +
        ":" +
        (s <= 9 ? "0" + s : s) +
        ":" +
        date.getMilliseconds(),
    };
  };

  /**
   * Interface for handling the output of the generated log entry.
   */
  this.output = function (logEntry) {
    switch (this.options.outputType) {
      case 0:
        break;
      case 1:
        this.sendLog(logEntry);
        break;
      default:
        break;
    }
  };

  /**
   * Makes an AJAX call to send the log data set to the server.
   */
  this.sendLog = async function (entry) {
    try {
      await Communication.webservice("log", {
        data: {
          courseid: parseInt(this.courseid, 10),
          hypervideoid: parseInt(this.hypervideoid, 10),
          context: entry.context,
          action: entry.action,
          utc: Math.ceil(entry.utc / 1000),
          entry: JSON.stringify(entry),
        },
      });
    } catch (e) {
      console.error("mod_hypervideo_log fail", e);
    }
  };
}
