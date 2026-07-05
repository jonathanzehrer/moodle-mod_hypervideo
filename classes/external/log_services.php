<?php
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
 * Logging external services.
 *
 * @package    mod_hypervideo
 * @category   external
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_hypervideo\external;

use external_function_parameters;
use external_single_structure;
use external_value;

defined('MOODLE_INTERNAL') || die;

global $CFG;
require_once("$CFG->libdir/externallib.php");

/**
 * Logging external services class.
 *
 * @package    mod_hypervideo
 * @category   external
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class log_services extends base_external {

    /**
     * Returns description of log parameters.
     *
     * @return external_function_parameters
     */
    public static function log_parameters() {
        return new external_function_parameters([
            'data' => new external_single_structure([
                'courseid' => new external_value(PARAM_INT, 'Course ID', VALUE_OPTIONAL),
                'hypervideoid' => new external_value(PARAM_INT, 'Hypervideo instance ID', VALUE_OPTIONAL),
                'action' => new external_value(PARAM_TEXT, 'Log action', VALUE_OPTIONAL),
                'utc' => new external_value(PARAM_INT, 'UTC timestamp', VALUE_OPTIONAL),
                'entry' => new external_value(PARAM_RAW, 'JSON encoded log data', VALUE_OPTIONAL),
            ]),
        ]);
    }

    /**
     * Log a video interaction event.
     *
     * @param array $data Log data
     * @return array
     */
    public static function log($data) {
        global $USER;

        $params = self::validate_parameters(self::log_parameters(), ['data' => $data]);
        $data = $params['data'];

        // Validate context.
        $cm = get_coursemodule_from_instance('hypervideo', $data['hypervideoid'], 0, false, MUST_EXIST);
        $context = \context_module::instance($cm->id);
        self::validate_context($context);

        $d = json_decode($data['entry']);

        $event = \mod_hypervideo\event\video_interaction_logged::create([
            'objectid' => (int) $data['hypervideoid'],
            'context' => $d->value->context ?? $context,
            'userid' => $USER->id,
            'other' => [
                'courseid' => (int) $data['courseid'],
                'url' => (string) $d->location->url,
                'videocontext' => (string) $d->value->context,
                'position' => (string) round($d->value->currenttime, 3),
                'actions' => (string) $d->value->action,
                'val' => strval($d->value->values),
                'duration' => round($d->value->duration, 3),
                'timemodified' => (int) $data['utc'],
            ],
        ]);
        $event->trigger();

        return [
            'success' => true,
            'response' => json_encode(true),
        ];
    }

    /**
     * Returns description of log return value.
     *
     * @return external_single_structure
     */
    public static function log_returns() {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL, 'Success variable'),
            'response' => new external_value(PARAM_RAW, 'Server response'),
        ]);
    }
}
