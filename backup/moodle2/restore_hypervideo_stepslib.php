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
 * Structure step to restore one hypervideo activity.
 *
 * @package    mod_hypervideo
 * @category   backup
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die;

/**
 * Structure step to restore one hypervideo activity.
 *
 * @package    mod_hypervideo
 * @category   backup
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class restore_hypervideo_activity_structure_step extends restore_activity_structure_step {

    /**
     * Define the structure for restoring.
     *
     * @return array
     */
    protected function define_structure() {
        $paths = [];
        $userinfo = $this->get_setting_value('userinfo');

        $paths[] = new restore_path_element('hypervideo', '/activity/hypervideo');
        if ($userinfo) {
            $paths[] = new restore_path_element('hypervideo_log', '/activity/hypervideo/hypervideo_log');
        }

        return $this->prepare_activity_structure($paths);
    }

    /**
     * Process the hypervideo element.
     *
     * @param array $data Restore data
     */
    protected function process_hypervideo($data) {
        global $DB;

        $data = (object)$data;
        $oldid = $data->id;
        $data->course = $this->get_courseid();
        $data->timecreated = $this->apply_date_offset($data->timecreated);
        $data->timemodified = $this->apply_date_offset($data->timemodified);

        $newitemid = $DB->insert_record('hypervideo', $data);
        $this->apply_activity_instance($newitemid);
    }

    /**
     * Process the hypervideo_log element.
     *
     * @param array $data Restore data
     */
    protected function process_hypervideo_log($data) {
        global $DB;

        $data = (object)$data;
        $data->hypervideo = $this->get_new_parentid('hypervideo');
        $data->userid = $this->get_mappingid('user', $data->userid);
        $data->timemodified = $this->apply_date_offset($data->timemodified);

        $DB->insert_record('hypervideo_log', $data);
    }

    /**
     * Execute after restore.
     */
    protected function after_execute() {
        $this->add_related_files('mod_hypervideo', 'intro', null);
    }
}
