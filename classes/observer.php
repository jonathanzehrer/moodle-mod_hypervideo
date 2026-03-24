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
 * Event observer for mod_hypervideo.
 *
 * @package    mod_hypervideo
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_hypervideo;

/**
 * Observer that reacts to hypervideo events.
 *
 * @package    mod_hypervideo
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class observer {

    /**
     * Handle the video_interaction_logged event by persisting to the hypervideo_log table.
     *
     * @param \mod_hypervideo\event\video_interaction_logged $event
     */
    public static function store_video_interaction(\mod_hypervideo\event\video_interaction_logged $event) {
        global $DB;

        $other = $event->other;

        $record = new \stdClass();
        $record->hypervideo  = $event->objectid;
        $record->userid      = $event->userid;
        $record->course      = $other['courseid'];
        $record->url         = $other['url'];
        $record->context     = $other['videocontext'];
        $record->position    = $other['position'];
        $record->actions     = $other['actions'];
        $record->val         = $other['val'];
        $record->duration    = $other['duration'];
        $record->timemodified = $other['timemodified'];

        $DB->insert_record('hypervideo_log', $record);
    }
}
