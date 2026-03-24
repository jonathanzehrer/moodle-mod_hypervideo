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
 * Define the complete hypervideo structure for backup.
 *
 * @package    mod_hypervideo
 * @category   backup
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die;

/**
 * Define the complete hypervideo structure for backup, with file and id annotations.
 *
 * @package    mod_hypervideo
 * @category   backup
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class backup_hypervideo_activity_structure_step extends backup_activity_structure_step {

    /**
     * Define the structure for the hypervideo activity.
     *
     * @return backup_nested_element
     */
    protected function define_structure() {

        // To know if we are including userinfo.
        $userinfo = $this->get_setting_value('userinfo');

        // Define each element separated.
        $hypervideo = new backup_nested_element('hypervideo', ['id'], [
            'course', 'name', 'url', 'chapters', 'intro', 'introformat',
            'timecreated', 'timemodified',
        ]);

        $hypervideolog = new backup_nested_element('hypervideo_log', ['id'], [
            'hypervideo', 'userid', 'course', 'url', 'context',
            'position', 'actions', 'val', 'duration',
            'timemodified',
        ]);

        // Build the tree.
        $hypervideo->add_child($hypervideolog);

        // Define sources.
        $hypervideo->set_source_table('hypervideo', ['id' => backup::VAR_ACTIVITYID]);

        if ($userinfo) {
            $hypervideolog->set_source_table('hypervideo_log', ['hypervideo' => backup::VAR_PARENTID]);
        }

        // Define id annotations.
        $hypervideolog->annotate_ids('user', 'userid');

        // Define file annotations.
        $hypervideo->annotate_files('mod_hypervideo', 'intro', null);

        return $this->prepare_activity_structure($hypervideo);
    }
}
