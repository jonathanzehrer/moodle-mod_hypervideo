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
 * Upgrade steps for mod_hypervideo.
 *
 * @package    mod_hypervideo
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Execute mod_hypervideo upgrade from the given old version.
 *
 * @param int $oldversion The old version of the plugin
 * @return bool
 */
function xmldb_hypervideo_upgrade($oldversion = 0) {
    global $DB;
    $dbman = $DB->get_manager();

    if ($oldversion < 2022100114) {
        $table = new xmldb_table('hypervideo_log');
        $field = new xmldb_field('duration', XMLDB_TYPE_INTEGER, '10', null, null, null, null, null);

        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        upgrade_plugin_savepoint(true, 2022100114, 'mod', 'hypervideo');
    }

    if ($oldversion < 2026032401) {
        $table = new xmldb_table('hypervideo');
        $field = new xmldb_field('chapters', XMLDB_TYPE_TEXT, null, null, null, null, null, 'url');

        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        upgrade_plugin_savepoint(true, 2026032401, 'mod', 'hypervideo');
    }

    if ($oldversion < 2026070101) {
        $table = new xmldb_table('hypervideo');
        $field = new xmldb_field('playerstyle', XMLDB_TYPE_CHAR, '255', null, XMLDB_NOTNULL, null, 'AppVariant1.vue', 'chapters');

        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        upgrade_plugin_savepoint(true, 2026070101, 'mod', 'hypervideo');
    }

    return true;
}
