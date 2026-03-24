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
 * Base external API class with shared utility methods.
 *
 * @package    mod_hypervideo
 * @category   external
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_hypervideo\external;

defined('MOODLE_INTERNAL') || die;

global $CFG;
require_once("$CFG->libdir/externallib.php");

/**
 * Base class with shared utility methods for external API.
 *
 * @package    mod_hypervideo
 * @category   external
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
abstract class base_external extends \external_api {
    /**
     * Validate course module context by hypervideo ID.
     *
     * @param int $hypervideoid Hypervideo instance ID
     * @return \context_module
     */
    protected static function validate_cm_context($hypervideoid) {
        $cm = get_coursemodule_from_instance('hypervideo', $hypervideoid, 0, false, MUST_EXIST);
        $context = \context_module::instance($cm->id);
        self::validate_context($context);
        return $context;
    }

    /**
     * Get course module by hypervideo ID.
     *
     * @param int $hypervideoid Hypervideo instance ID
     * @return object Course module record
     */
    protected static function get_cm_by_hypervideoid($hypervideoid) {
        return get_coursemodule_from_instance('hypervideo', $hypervideoid, 0, false, MUST_EXIST);
    }
}
