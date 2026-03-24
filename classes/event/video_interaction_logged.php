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
 * The mod_hypervideo video interaction logged event.
 *
 * @package    mod_hypervideo
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_hypervideo\event;

/**
 * Event triggered when a video interaction is logged (play, pause, seeked, playback, ended, etc.).
 *
 * @package    mod_hypervideo
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class video_interaction_logged extends \core\event\base {

    /**
     * Init method.
     */
    protected function init() {
        $this->data['crud'] = 'c';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
        $this->data['objecttable'] = 'hypervideo';
    }

    /**
     * Returns localised event name.
     *
     * @return string
     */
    public static function get_name() {
        return get_string('eventvideointeractionlogged', 'hypervideo');
    }

    /**
     * Returns description of what happened.
     *
     * @return string
     */
    public function get_description() {
        $action = $this->other['actions'] ?? 'unknown';
        return "The user with id '$this->userid' performed the video interaction '$action' " .
               "on the hypervideo with course module id '$this->contextinstanceid'.";
    }

    /**
     * Returns relevant URL.
     *
     * @return \moodle_url
     */
    public function get_url() {
        return new \moodle_url('/mod/hypervideo/view.php', ['id' => $this->contextinstanceid]);
    }

    /**
     * Return the mapping for object ID to database table.
     *
     * @return array
     */
    public static function get_objectid_mapping() {
        return ['db' => 'hypervideo', 'restore' => 'hypervideo'];
    }

    /**
     * Return the mapping for 'other' data.
     *
     * @return array
     */
    public static function get_other_mapping() {
        return [
            'courseid' => ['db' => 'course', 'restore' => 'course'],
        ];
    }

    /**
     * Custom validation.
     */
    protected function validate_data() {
        parent::validate_data();
        if (!isset($this->other['actions'])) {
            throw new \coding_exception('The \'actions\' value must be set in other.');
        }
    }
}
