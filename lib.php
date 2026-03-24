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
 * Library of interface functions and constants for mod_hypervideo.
 *
 * @package    mod_hypervideo
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Returns the features supported by this module.
 *
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed True if module supports feature, false if not, null if doesn't know or N/A
 */
function hypervideo_supports($feature) {
    switch ($feature) {
        case FEATURE_GROUPS:
            return false;
        case FEATURE_GROUPINGS:
            return false;
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_COMPLETION_TRACKS_VIEWS:
            return true;
        case FEATURE_MOD_PURPOSE:
            return MOD_PURPOSE_CONTENT;
        default:
            return null;
    }
}

/**
 * Add a new hypervideo instance.
 *
 * @param stdClass $data Form data
 * @return int New instance ID
 */
function hypervideo_add_instance($data) {
    global $DB;

    $data->timecreated = time();
    $data->timemodified = time();

    $id = $DB->insert_record('hypervideo', $data);
    return $id;
}

/**
 * Update an existing hypervideo instance.
 *
 * @param stdClass $data Form data
 * @return bool True if successful
 */
function hypervideo_update_instance($data) {
    global $DB;

    $data->timemodified = time();
    $data->id = $data->instance;

    return $DB->update_record('hypervideo', $data);
}

/**
 * Delete a hypervideo instance.
 *
 * @param int $id Instance ID
 * @return bool True if successful
 */
function hypervideo_delete_instance($id) {
    global $DB;

    if (!$DB->get_record('hypervideo', ['id' => $id])) {
        return false;
    }

    $DB->delete_records('hypervideo_log', ['hypervideo' => $id]);
    $DB->delete_records('hypervideo', ['id' => $id]);
    return true;
}

/**
 * Mark the activity completed (if required) and trigger the course_module_viewed event.
 *
 * @param stdClass $hypervideo Hypervideo object
 * @param stdClass $course Course object
 * @param stdClass $cm Course module object
 * @param context_module $context Context object
 */
function hypervideo_view($hypervideo, $course, $cm, $context) {
    // Trigger course_module_viewed event.
    $params = [
        'context' => $context,
        'objectid' => $hypervideo->id,
    ];

    $event = \mod_hypervideo\event\course_module_viewed::create($params);
    $event->add_record_snapshot('course_modules', $cm);
    $event->add_record_snapshot('course', $course);
    $event->add_record_snapshot('hypervideo', $hypervideo);
    $event->trigger();

    // Completion.
    $completion = new completion_info($course);
    $completion->set_module_viewed($cm);
}

/**
 * Callback for calendar events.
 *
 * @param calendar_event $event The calendar event
 * @param \core_calendar\action_factory $factory The action factory
 * @param int $userid User id override
 * @return \core_calendar\local\event\entities\action_interface|null
 */
function mod_hypervideo_core_calendar_provide_event_action(
    calendar_event $event,
    \core_calendar\action_factory $factory,
    $userid = 0
) {
    global $USER;

    if (empty($userid)) {
        $userid = $USER->id;
    }

    $cm = get_fast_modinfo($event->courseid, $userid)->instances['hypervideo'][$event->instance];

    if (!$cm->uservisible) {
        return null;
    }

    $completion = new \completion_info($cm->get_course());

    $completiondata = $completion->get_data($cm, false, $userid);

    if ($completiondata->completionstate != COMPLETION_INCOMPLETE) {
        return null;
    }

    return $factory->create_instance(
        get_string('view'),
        new \moodle_url('/mod/hypervideo/view.php', ['id' => $cm->id]),
        1,
        true
    );
}

/**
 * Return the list valid content actions.
 *
 * @return array
 */
function hypervideo_get_view_actions() {
    return ['view', 'view all'];
}

/**
 * Return the list valid post actions.
 *
 * @return array
 */
function hypervideo_get_post_actions() {
    return ['update', 'add'];
}