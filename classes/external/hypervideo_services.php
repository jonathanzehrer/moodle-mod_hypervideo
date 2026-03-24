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
 * Hypervideo external services.
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
use context_module;

defined('MOODLE_INTERNAL') || die;

global $CFG;
require_once("$CFG->libdir/externallib.php");

/**
 * Hypervideo external services class.
 *
 * @package    mod_hypervideo
 * @category   external
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class hypervideo_services extends base_external {

    /**
     * Returns description of get_info parameters.
     *
     * @return external_function_parameters
     */
    public static function get_info_parameters() {
        return new external_function_parameters([
            'cmid' => new external_value(PARAM_INT, 'Course module ID'),
        ]);
    }

    /**
     * Get hypervideo instance info.
     *
     * @param int $cmid Course module ID
     * @return array
     */
    public static function get_info($cmid) {
        global $DB, $PAGE;

        $params = self::validate_parameters(self::get_info_parameters(), ['cmid' => $cmid]);

        $cm = get_coursemodule_from_id('hypervideo', $params['cmid'], 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);
        self::validate_context($context);
        require_capability('mod/hypervideo:view', $context);

        $data = $DB->get_record('hypervideo', ['id' => $cm->instance], '*', MUST_EXIST);

        try {
            $PAGE->set_context($context);
            $data->intro = format_module_intro('hypervideo', $data, $cm->id);
        } catch (\Exception $e) {
            $data->intro = '';
        }

        return [
            'success' => true,
            'data' => json_encode($data),
        ];
    }

    /**
     * Returns description of get_info return value.
     *
     * @return external_single_structure
     */
    public static function get_info_returns() {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL, 'Success variable'),
            'data' => new external_value(PARAM_RAW, 'JSON encoded hypervideo data'),
        ]);
    }

    /**
     * Returns description of get_video_progress parameters.
     *
     * @return external_function_parameters
     */
    public static function get_video_progress_parameters() {
        return new external_function_parameters([
            'data' => new external_single_structure([
                'course' => new external_value(PARAM_INT, 'Course ID'),
                'hypervideo' => new external_value(PARAM_INT, 'Hypervideo instance ID'),
            ]),
        ]);
    }

    /**
     * Get the video playback progress for the current user.
     *
     * @param array $data Contains course and hypervideo IDs
     * @return array
     */
    public static function get_video_progress($data) {
        global $DB, $USER;

        $params = self::validate_parameters(self::get_video_progress_parameters(), ['data' => $data]);
        $data = $params['data'];

        // Validate context.
        self::validate_cm_context($data['hypervideo']);

        $videoprogress = $DB->count_records('hypervideo_log', [
            'actions' => 'playback',
            'course' => $data['course'],
            'userid' => $USER->id,
            'hypervideo' => $data['hypervideo'],
        ]);

        return [
            'success' => true,
            'data' => json_encode([
                'videoprogress' => $videoprogress,
            ]),
        ];
    }

    /**
     * Returns description of get_video_progress return value.
     *
     * @return external_single_structure
     */
    public static function get_video_progress_returns() {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL, 'Success variable'),
            'data' => new external_value(PARAM_RAW, 'JSON encoded progress data'),
        ]);
    }

    /**
     * Simulate the hypervideo/view.php web interface page: trigger events, completion, etc.
     *
     * @param int $hypervideoid The hypervideo instance ID
     * @return array of warnings and status result
     */
    public static function view_hypervideo($hypervideoid) {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/mod/hypervideo/lib.php');

        $params = self::validate_parameters(
            self::view_hypervideo_parameters(),
            ['hypervideoid' => $hypervideoid]
        );

        $hypervideo = $DB->get_record('hypervideo', ['id' => $params['hypervideoid']], '*', MUST_EXIST);
        [$course, $cm] = get_course_and_cm_from_instance($hypervideo, 'hypervideo');

        $context = context_module::instance($cm->id);
        self::validate_context($context);
        require_capability('mod/hypervideo:view', $context);

        hypervideo_view($hypervideo, $course, $cm, $context);

        return [
            'status' => true,
            'warnings' => [],
        ];
    }

    /**
     * Returns description of view_hypervideo parameters.
     *
     * @return external_function_parameters
     */
    public static function view_hypervideo_parameters() {
        return new external_function_parameters([
            'hypervideoid' => new external_value(PARAM_INT, 'Hypervideo instance ID'),
        ]);
    }

    /**
     * Returns description of view_hypervideo return value.
     *
     * @return external_single_structure
     */
    public static function view_hypervideo_returns() {
        return new external_single_structure([
            'status' => new external_value(PARAM_BOOL, 'Status: true if success'),
            'warnings' => new \external_warnings(),
        ]);
    }
}
